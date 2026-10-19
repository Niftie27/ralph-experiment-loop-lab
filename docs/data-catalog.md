# Data catalog

Read-only inspection: 2026-10-17 UTC (inventory snapshot from the initial 14:00 UTC work period; documentation finalized after the later continuation). This catalog records **observed storage**, not a claim that each dataset is complete or suitable for a strategy. No collector, watcher, service, scheduler, exchange account, or stored data was changed. Source questions are answered from local code/files; unresolved semantics are marked **not verified**. Public-repository policy: no host/account identifiers, credentials, chat content, session content or voice content.

W1 archive move completed 2026-10-19: D131 and D065–D069 now reside on the box; their local copies were removed after verification. Historical inspection sizes, schemas, examples and local sample paths below remain the 2026-10-17 snapshot, not current local availability. See [W1 manifest](archive-moves/w1-2026-10-19.csv).

## Method and scope

`tools/data-catalog/inventory.py` uses only the Python standard library, opens data read-only, and prints JSONL to stdout. Run from this checkout:

```sh
systemd-run --user --scope -p CPUQuota=50% -p MemoryMax=1G -- nice -n 19 ionice -c 3 python3 tools/data-catalog/inventory.py
```

Optional `--pattern NAME GLOB` selects a path pattern; `--metadata-only` suppresses row reads. No package install, persistent job, or service restart is involved. The implementation brief is: discover known path families, stat physical files, choose a settled partition, stream compressed records, union observed field/type paths, report stats; test with synthetic compressed/CSV fixtures and the actual read-only run. No trading/collector interface changes.

- **File count / total bytes**: physical retained files, excluding symlinks, `.tmp`, `.pyc`, node_modules and Git internals. Counts are not deduplicated across different checkout copies. Logical datasets can have overlapping report/cache views; do not sum the entire catalog as disk usage.
- **First / last file time**: UTC partition from the filename where available, otherwise filesystem modification time; neither is a guaranteed creation or first exchange-event time. `_partial` files are not full sessions. Historical availability is not inferred from an mtime.
- **Bytes/day**: stored bytes attributed to the UTC filename date, otherwise mtime, for the seven calendar dates ending on inspection day. Today is partial. These are retained/compressed storage volumes, **not measured network ingress or original historical writes**. Recompression moves mtimes; filename dates avoid that distortion for market partitions.
- **Complete file**: filename hour/day has ended plus 900 seconds, and mtime is at least 900 seconds old. Collector tapes normally finalize after 10 minutes but can be reopened by very late backfill. This is an eligibility heuristic, not a write lock or proof of immutability. Mutable files are explicitly sampled as snapshots, not called complete. Before/after stat checks detect changes during a read.
- **Rows/hour**: actual rows of the selected closed hourly file; daily append logs/bars divide by 24 and are labeled daily-average, not a peak or coverage guarantee. Static research tables/profiles and mutable snapshots do not have an ingest rows/hour rate.
- **Time-field detection (D1b)**: name-matched scalar fields must contain only integer epoch seconds or milliseconds (2000-01-01 inclusive to 2100-01-01 exclusive; nulls ignored). Strings, booleans, floats, durations and microseconds are excluded; mixed non-null types invalidate the field. Nested arrays/objects are checked. Historical catalog time-field lines are narrowed using already-recorded integer extrema, not a fresh outcome-data scan. ISO time strings remain meaningful clocks in producer documentation, but are not integer epoch fields.
- **Schema**: union across all rows in the selected file, not all historical files. CSV physical types are strings; semantic numeric/boolean units are documented separately. `[]` denotes array elements; `{}` numeric map keys. Null/empty values mean unavailable, not zero. Polymorphic streams need their stream discriminator.
- **Personal categories**: only category + file count + size. Only aggregate category labels, counts and sizes are reported for personal material; no private contents, record schemas or examples are cataloged. Personal records are excluded from data examples even where they are produced by a market tool. D102/D106/D109 were explicitly reclassified as research on 2026-10-18; their dedicated structural-only scan below has no examples or outcome aggregates. The default inventory remains conservative metadata-only for these filenames so a routine invocation cannot reveal V6 interim outcomes.
- A source-code hash identifies inspected code, not proof that an earlier historical file was produced by that exact revision. CLI-driven research may override paths; untraced runs remain not verified.

## Agent access channels

Read-only configuration inspection on 2026-10-18: OpenClaw `mcp.servers` contains:

| Server name | Transport | Enabled |
|---|---|---|
| obsidian-vault-files | stdio | true |

No Binance MCP is configured in OpenClaw. Binance access in the inspected producers is direct public REST/WebSocket/archive access, not an MCP server. This is configured-channel evidence, not a connectivity test. URLs, headers, commands, tokens and environment values are intentionally omitted. Other agent/application connectors are not inferred to be OpenClaw MCP configuration.

## Writers, deployment and all known output families

Runtime entrypoints and their repo copies were hashed read-only. Collector modules, the v1 market watcher, both short watchers, supervisor, reactor, dashboard, data-check, disk-alert, archive and maintenance scripts matched. Their hashes appear in dataset sections. **R2 remains partial:** five previously workspace-only downstream scripts were copied byte-for-byte into `tools/workspace-mirror/` on 2026-10-18; see the manifest below. Five excluded scripts remain unmirrored under the explicit privacy/host rule. No runtime file or deployment was changed. A source mirror is not a relocation: relative runtime paths still resolve in the original workspace.

| Trigger / producer | Writes / outputs | Timing and evidence |
|---|---|---|
| `ralph-collector.service`, `ralph-collector-{ethusdt,solusdt,hypeusdt}.service` → `~/ralph_collector/binance_live.py` + `orderflow_engine.py` | `~/data/binance{,-ethusdt,-solusdt,-hypeusdt}/{raw,tape,book}_*`; matching `~/data/features*/live.json`, `live_bars_*`, `live_events_*`, `live_footprint_*`, `live_sessions.csv`, `all_prices_*`, `engine_state.json`; atomic `.tmp` intermediates | Active units, `--all`, `--features`; hourly recorder, daily append features, latest snapshot every ~2 s |
| `ralph-collector-dashboard.service` → `dashboard.py` | No persistent market dataset; HTTP responses and system journal | Reads BTC raw/tapes/features; localhost dashboard |
| `ralph-storage-maintenance.timer/service` → `storage_maintenance.py` | Closed `.csv` → `.csv.gz`; closed `.jsonl.gz` raw → `.jsonl.xz`, temporary output beside source; operational journal; `~/ralph-state/raw-deleted.csv` only if deletion explicitly enabled | Hourly, four symbols; unit has `--apply --retention-days 7`, **no `--delete-raw`**. Seven days is an eligibility threshold, not an active deletion policy. Deletion requires data-check verification plus archive PASS/hash gates |
| `ralph-archive-upload.timer/service` → `archive_upload.py` | `~/ralph-state/archive-files.csv`, `archive-upload.lock`; remote `ralph/raw/<SYMBOL>/<day>/<raw file>` and `ralph/derived/<SYMBOL>/<day>/<tape or book file>`; journal | At minute 40 hourly; writes remote checksummed copies in normal service operation. This inspection only listed remote storage; it did not run uploader |
| `ralph-data-checks.timer/service` → `data_checks.py` | `~/ralph-data-checks-repo/data-checks/YYYY-MM-DD.csv`; Git metadata/commits in that separate timer checkout; journal | 00:20 UTC daily, `--commit-push`; one check per symbol/hour; not this docs checkout |
| `ralph-disk-alert.timer/service` → `disk_alert.py` | `~/data/disk-alert-state.json` via `.tmp`; journal; existing alert channel | Hourly, threshold 20% free, six-hour throttle. Test state also exists |
| `crypto-updates-market-watcher.service` → `tools/crypto-updates/realtime-market-watcher.mjs` runtime copy | Under `~/.openclaw/workspace/crypto-updates/runtime/`: `alert-feedback.jsonl`, `paper-trades.jsonl`, `demo-sim-trades.jsonl`, `realtime-market-watcher.pid`, `realtime-market-watcher.log`; calls the two indexers below | Binance **spot** BTC/ETH/SOL `trade`, `depth5@100ms`; Hyperliquid WebSocket HYPE; candle REST and local futures feature enrichment. Not an archival raw feed |
| Crontab `@reboot` and every minute → `ensure-short-watchers.sh` | `~/.openclaw/workspace/.tmp/{btc-short-watch-82k,zec-hype-short-watch}.{pid,log}`, `short-watchers-supervisor.log` | Supervisor launches only when PID/script check fails; existing scripts poll Bybit public market endpoints. Both watchers and v1 untouched |
| `bybit-execution-reactor.service` → `bybit-execution-reactor.mjs` | Runtime `bybit-execution-reactor-state.json`, `execution-feedback.jsonl`, `bybit-execution-reactor.log`; journal indexer outputs | Existing read-only private Bybit polling at 30 s. Account records are personal: counts/sizes only; no endpoint was queried here |
| Workspace `crypto-updates/index-monitor-feedback.mjs` | Runtime `monitor-index.sqlite`; `crypto-updates/monitor-index.yaml`; `crypto-updates/wiki/monitor/index.md`, `daily/<day>.md` | Derived from feedback; triggered by watcher; runtime hash recorded below, repo mirror verified in the D1b manifest below |
| Workspace `crypto-updates/index-trade-research-journal.mjs` | Runtime `trade-research-journal.json`; `crypto-updates/wiki/trading-journal/` index, daily, alerts, executions, followed-alert-setups, modified-alert-setups, manual-independent-trades, paper-shadow-alerts; workspace research `experiments/btc-eth-alert-edge/results/live-ta-execution-journal.md` | Derived from alert/execution feedback; personal aggregation only; repo mirror verified in the D1b manifest below |
| Workspace `analyze-alert-setups.mjs` | Runtime `setup-analysis.json`, `setup-candle-context-cache.json`; setup-analysis YAML/wiki outputs | Public spot/Hyperliquid candles plus local alerts; on-demand; repo copy absent |
| Workspace `orderflow-spike.mjs`, `orderflow-features.mjs` | Runtime `orderflow-spikes/<run>/{raw-events.jsonl,orderflow.sqlite,manifest.yaml,features-1s.csv,features.sqlite,features-manifest.yaml}`; shell capture logs under `long-captures/` | On-demand public Binance/Hyperliquid experiments; not continuous collector coverage |
| Workspace `orderflow-alert-replay-alignment.mjs`, `verify-ralph-orderflow-replay.mjs`, `service-health-check.mjs` | Runtime `orderflow-alignment/latest.json` and report; `ralph-replay-checks/<symbol>_<day>.{json,md}`; `service-health-report.json` plus Markdown report | On-demand checks; first script now mirrored with equal hash; other two have matching runtime/repo copies |
| `tools/alert-eval/*.py`, local `~/ralph-state/a2c_*.py`, one-off research download commands | `~/ralph-state/` evaluation outputs remain local; research downloads, checksums, manifest and mark candles now on box `research/ralph-research-data/` (S2); local `~/ralph-research-data/` removed 2026-10-19 | Restore S2 with rsync back to `~/ralph-research-data/` before a2c scripts. [W1 manifest](archive-moves/w1-2026-10-19.csv), also box `research/manifests/w1-2026-10-19.csv`. D131 cache separately on box `research/binance-usdm-archive-cache/` (`zstd -9`; restore rsync + `zstd -d`); `binance-usdm-archive.mjs` re-downloads missing cache files on demand. Historical one-off producer provenance remains not verified |
| Experiment `src/*.mjs` runners, archive/market loaders, H2 contract | `experiments/*/{data,results,runtime,paper}/` in repo and workspace research checkout; H2 content-addressed JSON, manifest and variant registry | Not all experiments are scheduled. Paths are relative to each script's checkout; copies are separate storage |
| OpenClaw gateway/node, Obsidian, transcription and backup workflows | Chat/session/voice/memory/backups, generated knowledge/index storage and operational logs | Personal aggregate categories only; outside market collection. No private contents inspected. System/OS journal and package caches are infrastructure, not claimed as market datasets |

## Downstream source mirror verification (D1b)

Source paths below are relative to the workspace except the explicitly external research scripts. Mirrors are stored under `tools/workspace-mirror/<source path>`. No scripts were executed or edited at runtime. Hash equality was checked after copying; full hashes identify bytes, not historical provenance. Public API host literals were also excluded under the literal host rule; sources were not sanitized because that would break byte equality.

| Source | Status | Runtime SHA-256 = repo SHA-256 (mirrored only) |
|---|---|---|
| `crypto-updates/index-monitor-feedback.mjs` | mirrored; equal | `066982ce05ad20cddc61ebd8664eb23fac9300deec9da8346f0d9340b1fd3be6` |
| `crypto-updates/index-trade-research-journal.mjs` | mirrored; equal | `42109565b26a7ee754b98b7a52c9ca687417f3ca529ccdc1601d48439ba68bfa` |
| `crypto-updates/analyze-alert-setups.mjs` | not mirrored: literal public API host (strict host exclusion; no runtime edits) | — |
| `crypto-updates/orderflow-spike.mjs` | not mirrored: literal public API host (strict host exclusion; no runtime edits) | — |
| `crypto-updates/orderflow-features.mjs` | mirrored; equal | `40c96e7c5df2b0f65cc609f386b469baccecfafd13c6e7342222ba2ec06f2458` |
| `crypto-updates/orderflow-alert-replay-alignment.mjs` | mirrored; equal | `754db289dccf93ce870e6b20eab2515871091b8752960eb1e386bd2f86e868c9` |
| `scripts/a2b_history_proof.py` | not mirrored: home path, username | — |
| `~/ralph-state/a2c_bybit_crosscheck.py` | not mirrored: home path, username | — |
| `~/ralph-state/a2c_minute_basis_remaining.py` | not mirrored: home path, username | — |
| `ralph-research-os/experiments/volume-velocity-dex-discrepancy/src/normalize-replay-warehouse-rows.mjs` | mirrored; equal (newly traced D144 writer) | `b708776397d8b06486a7005eb681c495efdcab0d7b4755d52c6349e6083e2c14` |

## Scheduler evidence (D1b)

All 11 OpenClaw jobs, including disabled jobs, were listed read-only; all 11 full prompts/payloads were inspected. No job was run or edited. `liquid-crypto-alert-edge-backtest` is enabled, every four hours: its workdir is the workspace root, with npm prefixes `ralph-research-os/experiments/...`. It explicitly runs the two feedback/journal indexers, universe, backtest, demo-sim:all, verify, shadow ledger, wick-feedback and aggtrades-velocity studies, then state-of-edge. These paths target workspace datasets, not the separate public checkout. Weekly maintenance and the adversarial loop target workspace health/automation outputs; autoresearch selects a bounded queue item and does not prove a particular historical cache writer. State-of-edge daily and the ETH/SOL replay job are disabled.

Installed user/system service definitions and the user crontab were read without mutation. Collector, maintenance, upload, checks, disk alert, market watcher and execution reactor entrypoints agree with the writer matrix. Crontab contains the short-watcher supervisor at reboot and every minute, not the unresolved one-off research exports. These trigger inspections do not establish the provenance of arbitrary historical reports.

## Storage Box: read-only top-two-level size listing

One `du -k -d 2 .` listing through the existing connection alias succeeded. Values are **allocated KiB**, not local inventory apparent bytes. No remote file reads, hashes, uploads, downloads, moves or deletes were performed. Connection identifiers and authentication metadata are intentionally absent.

| Listed path | Allocated KiB | Status |
|---|---:|---|
| `.` | 14,169,103 | Root total includes infrastructure metadata not enumerated here |
| `ralph/` | 14,169,092 | Market archive root |
| `ralph/raw/` | 12,212,461 | Raw archive; deeper symbol/day paths established from uploader code, not an extra remote listing |
| `ralph/derived/` | 1,948,421 | Tape/book archive |
| `ralph/_test/` | 8,210 | Existing test data; producer not verified |
| `research/` | 1 | Existing directory; producer not verified |

Remote file counts, remote oldest/newest event time, row schemas and retention beyond the uploader's layout are **not verified**: the authorized remote action was only this shallow listing. Local archive PASS rows describe earlier uploader verification, not a fresh remote integrity proof.

## Common data semantics and limits

### Binance futures raw stream variants

All four USD-M symbols use `wss://fstream.binance.com` routed combined streams. Envelope: `recv_ms` integer local receive/poll completion epoch **ms**, `src` string `ws|rest`, `stream` string symbol/stream name, `data` object unmodified exchange payload. Raw rotation uses **receive hour**. REST trade backfill appears in raw as additional records; raw row count is not unique-trade count.

| Stream | Payload fields / units / meaning | Time and limitation |
|---|---|---|
| `<symbol>@aggTrade` | `e` event name; `E` event ms; `s` symbol; `a` aggregate ID; `p` price decimal string USDT/base; `q` quantity decimal string base; `f`,`l` first/last constituent trade IDs; `T` trade ms; `m` boolean buyer-is-maker (true = seller aggressor). Additional unconsumed exchange fields are preserved; `nq` semantics not verified from local producer | `T` exchange trade time, `E` exchange event time. Grouped fills, not individual orders or opened positions. Backfill only gaps <=300,000 aggregate IDs; REST retrieval limits/outages remain possible |
| `<symbol>@bookTicker` | `e`,`E`,`T`,`s`; `u` update ID; `b`,`a` best bid/ask decimal strings USDT/base; `B`,`A` bid/ask size decimal strings base | Exchange `E`/`T`, local `recv_ms`; fast path records without feeding the feature engine |
| `<symbol>@depth@100ms` | `e`,`E`,`T`,`s`; `U`,`u`,`pu` first/final/previous update IDs; `b`,`a` arrays of `[price decimal string, absolute quantity decimal string]`; quantity zero deletes level | Exchange `E`/`T`; sequence continuity must be checked across files/reconnects |
| `<symbol>@depthSnapshot` | REST `/fapi/v1/depth?limit=1000`; `lastUpdateId` sequence ID; `E`,`T` if supplied; `bids`,`asks` price/quantity arrays | Initial/recovery snapshot limited to 1,000 levels/side. Cannot claim every far-away exchange level; a replay hour may require a preceding snapshot |
| `<symbol>@forceOrder` | `e`,`E`; nested `o`: `s` symbol, `S` order side, `o` order type, `f` time-in-force, `q` order quantity base, `p` order price USDT/base, `ap` average execution price, `X` order status, `l` last fill quantity, `z` cumulative fill quantity, `T` exchange trade ms; numeric values commonly decimal strings | **Only latest liquidation per symbol per 1,000 ms**, user-supplied confirmed Binance limit. SELL closes a long, BUY closes a short. Not a complete liquidation tape or positions map |
| `<symbol>@markPrice@1s` | `e`,`E`,`s`; `p` mark, `i` index, `P` estimated-settlement price (USDT/base); `r` funding fraction; `T` next-funding epoch ms | `E` is event time; **`T` is next funding time, not trade time**. Extra `st`,`ps`,`ap` fields: semantics not verified from local consuming code |
| `<symbol>@openInterest` | REST `/fapi/v1/openInterest`; `symbol` string, `openInterest` decimal string base units, `time` exchange epoch ms | Poll every ~10 s plus request duration; `recv_ms` local completion. OI change cannot identify gross long/short openings |

Liquidation stream reference supplied by user (not re-fetched): https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Liquidation-Order-Streams . Other external specification lookups: **not verified**; no unavailable external page blocks this catalog.

### Tapes, book samples and feature field dictionary

Tapes have semicolon columns `Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs`. Positional unnamed headers are preserved in inventory as `column_3`, `column_4`, `column_5`. One row is one unique aggregate trade; `m=true` means volume sold at bid. `Bids` and `Ask` are synthetic opposite prices separated by one configured tick, **not contemporaneous executable BBO**. Delta resets for each UTC-hour tape and is re-sorted/recomputed at finalization. `Time` is a local-timezone rendering of exchange trade time, not receive time; `TradeTimeMs` is unambiguous exchange UTC epoch ms.

Book samples: one row `{t,u,b,a}` each ~1 s only while synced. `t` is **local sample epoch ms**, `u` update ID; `b` and `a` contain up to 100 `[numeric price USDT/base, numeric quantity base]` levels each, bid descending / ask ascending. This is resting-order-book liquidity, **not a liquidation heatmap**.

Features: all volumes/delta/quantity/depth/OI use symbol **base units**, prices/VWAP/deviation widths use USDT/base. One `live_bars_60s` row is a closed 60-second aggregate; `t_ms` / ISO `time` are exchange-trade-derived bar-start time. Only join a bar as-of `t` once `t_ms + 60000 <= t`. No separate receive timestamp is stored in bars. Feature code formulas below are local implementations, **not proprietary ATAS values**. Historical rounded directories are legacy artifacts; do not join them to corrected tapes silently.

| Fields | Logical type; unit | Meaning from `orderflow_engine.py` |
|---|---|---|
| `time`, `t_ms` | ISO string, integer ms | UTC bar start derived from exchange trade time |
| `open`, `high`, `low`, `close` | number; USDT/base | Trade OHLC in the bar/session |
| `volume`, `bought`, `sold`, `delta`, `delta_pct` | number; base except percent | Total traded, aggressive buys, aggressive sells, bought−sold, 100×delta/volume |
| `trades`, `max_delta`, `min_delta`, `cvd_session` | integer count; remaining number base | Aggregate trade count, intra-bar delta extrema, cumulative session delta |
| `poc`, `poc_vol` | number; USDT/base, base | Highest-volume binned footprint price and its volume |
| `vwap`, `vwap_sd`, `vwap_dist_sd` | number; price, price, standard-deviation multiples | Session volume-weighted price, weighted SD, (close−VWAP)/SD |
| `wvwap`, `wvwap_sd`, `wvwap_dist_sd` | number; same units | Weekly equivalent |
| `buy_imb`, `sell_imb`, `stack_buy`, `stack_sell` | integer; levels | Counts of diagonal footprint imbalances and longest consecutive stack |
| `cluster_hits` | integer; levels | Footprint cells whose total volume meets configured cluster threshold |
| `big_count`, `big_bought`, `big_sold`, `big_max`, `big_max_side` | count; base quantities; side string | Thresholded grouped-order observations, buy/sell quantities, maximum and side; inference, not exchange order identity |
| `vel_max` | number; multiple | Largest configured volume-velocity ratio |
| `absorb_candle`, `absorb_high`, `absorb_low`, `exhaust_high`, `exhaust_low` | label, boolean/0–1 flags | Heuristic absorption/exhaustion classification; not direct observation of hidden liquidity |
| `liq_long`, `liq_short`, `liq_count` | number base; integer events | Sum of published liquidation quantities and event count; subject to forceOrder cap |
| `mark`, `index`, `premium`, `funding` | price, price, price difference, fraction | Last mark/index, mark−index, latest funding rate |
| `oi`, `d_oi` | number; base | Latest polled OI and difference from bar-open OI |
| `best_bid`, `best_ask`, `spread` | number; USDT/base | Best sampled prices and ask−bid |
| `bid_depth`, `ask_depth`, `book_imb` | number; base, base, ratio | Sampled top-100 sums and (bid−ask)/(bid+ask) |
| `bid_wall_px`, `ask_wall_px`, `bid_wall_qty`, `ask_wall_qty` | number; prices and base quantities | Largest size level within the sampled book |
| `s_poc`, `s_vah`, `s_val`, `s_high`, `s_low` | number; USDT/base | Current session profile POC/value-area/high/low |
| `pd_high`, `pd_low`, `pd_poc`, `pd_vah`, `pd_val`, `pd_vwap` | number; USDT/base | Previous completed session levels |
| `naked_poc_above`, `naked_poc_below` | number; USDT/base | Nearest not-yet-touched past session POCs |
| `day`, `partial` | UTC-date string, 0–1 flag | Session partition and incomplete-session indicator |
| profile `Price`, `Volume`, `Trades`, `Bid`, `Asks`, `Delta` | price; base; count; base; base; base | Tick-level session volume profile, sell/buy aggression, signed volume |
| footprint `t`, `step`, `lv` | ms, price, array | Bar start, footprint bin width, descending `[price,sold,bought,aggregate-trade-count]` levels |
| events `type`, `t`, `time` | string, ms, ISO string | Event discriminator and event-specific clock; trade events exchange-derived, book-wall events local sampled time |
| events `side`, `kind`, `liquidated` | strings | Buy/sell or bid/ask, bull/bear classification, long/short liquidation |
| events `price`, `avg_price`, `from`, `to`, `qty`, `volume`, `delta`, `bought`, `sold`, `trades`, `levels`, `ratio`, `from_day` | price endpoints; base quantities; counts; ratio; date | Event-specific trade/cluster/wall/velocity/imbalance/POC attributes; `from`/`to` are prices, **not timestamps** |
| engine state `prev`, `naked` | arrays | Previous session summaries and `[untouched POC price, originating day]` pairs; restart state, not exchange events |
| live snapshot `generated`, `collector`, `status`, `bars`, `events`, `footprints` | local epoch ms, objects/arrays | Latest bounded dashboard state. Bars ≤720, footprints ≤60; absence of older records is a cap, not evidence they never happened |

### Research input completeness

H2 has two frozen BTC/SOL 4h spot OHLCV arrays, each 8,760 rows, first candle `2021-10-18T00:00:00Z`, last `2025-10-16T20:00:00Z`. Filename is SHA-256 of JSON bytes. `h2-contract.mjs` writes snapshots exclusively (`wx`, mode 0444), `manifest-h2.json`, and append-only `variant-registry.jsonl`. `time` is exchange candle-open epoch **seconds**, OHLC prices are quote/base, volume base. Snapshots themselves contain no local receive time, delta, depth, liquidation events, proprietary deviations, manual levels, latency or transaction costs. Those inputs must be classified separately before a strategy/backtest claim; OHLCV rows alone are not a complete orderflow test dataset.

Binance research ZIPs hold daily USD-M aggTrades; Bybit public gzip CSVs hold individual public trade records; mark-kline CSVs are mark-price OHLC, **not traded-price OHLCV**. Neither OI nor trade direction identifies gross long/short openings. Research cache/history and point-in-time features need their own coverage and as-of checks; no new benchmark was run for this task.


## Dataset sections


### D001 — BTCUSDT raw

- Purpose: Replayable received exchange payloads.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M BTCUSDT; raw stream variants above.
- Location/naming: `~/data/binance/raw_BTCUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one received WebSocket payload or REST response/backfilled trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **210 files; 4,514,464,181 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T21:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T18:49:40.748307+00:00` / `2026-10-17T14:10:01.543477+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 283,821,976; 2026-10-12: 571,464,096; 2026-10-13: 648,262,916; 2026-10-14: 667,752,048; 2026-10-15: 792,421,996; 2026-10-16: 610,136,164; 2026-10-17: 166,149,581.
- Rows/hour: 418,854 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance/raw_BTCUSDT_2026-10-17T11Z.jsonl.xz`; inspected file: `~/data/binance/raw_BTCUSDT_2026-10-17T11Z.jsonl.xz`; rows: `418854`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S001](#schema-s001). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `data.E`, `data.T`, `data.time`, `recv_ms`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"recv_ms:integer": [1792234800091, 1792238399941], "data.E:integer": [1792234799975, 1792238399808], "data.T:integer": [1792234799974, 1792252800000], "data.time:integer": [1792234802617, 1792238390498]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"recv_ms":1792234800091,"src":"ws","stream":"btcusdt@depth@100ms","data":{"e":"depthUpdate","E":1792234799975,"T":1792234799974,"s":"BTCUSDT","ps":"BTCUSDT","U":11844438048173,"u":11844438053517,"pu":11844438048089,"b":[["…","…"],["…","…"],"…"],"…":"shortened"}}
```


### D002 — BTCUSDT tape

- Purpose: Trade-time signed aggression tape.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M BTCUSDT; raw stream variants above.
- Location/naming: `~/data/binance/tape_BTCUSDT_*.csv*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one deduplicated aggregate trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **210 files; 126,501,477 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T21:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T18:48:51.454976+00:00` / `2026-10-17T14:10:31.685356+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 6,894,346; 2026-10-12: 15,170,628; 2026-10-13: 18,454,709; 2026-10-14: 18,650,353; 2026-10-15: 26,380,177; 2026-10-16: 17,405,643; 2026-10-17: 4,434,820.
- Rows/hour: 10,529 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance/tape_BTCUSDT_2026-10-17T11Z.csv.gz`; inspected file: `~/data/binance/tape_BTCUSDT_2026-10-17T11Z.csv.gz`; rows: `10529`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"17.10.2026 11:00:00.058","Bids":"81614.2","column_3":"0.018","column_4":"0","column_5":"0","Ask":"81614.3","Delta":"-0.018","AggId":"3488433539","TradeTimeMs":"1792234800058"}
```


### D003 — BTCUSDT book

- Purpose: Sampled displayed-depth history.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M BTCUSDT; raw stream variants above.
- Location/naming: `~/data/binance/book_BTCUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one locally timed synced top-100-per-side book sample.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **210 files; 384,080,380 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T21:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-08T22:00:00.060404+00:00` / `2026-10-17T14:10:31.686356+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 33,001,613; 2026-10-12: 46,145,332; 2026-10-13: 49,016,024; 2026-10-14: 51,033,954; 2026-10-15: 55,567,894; 2026-10-16: 50,298,363; 2026-10-17: 18,792,930.
- Rows/hour: 3,524 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance/book_BTCUSDT_2026-10-17T12Z.jsonl.gz`; inspected file: `~/data/binance/book_BTCUSDT_2026-10-17T12Z.jsonl.gz`; rows: `3524`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S003](#schema-s003). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792238400027, 1792241999936]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792238400027,"u":11844687982211,"b":[[81538.0,6.107],[81537.9,0.073],"…"],"a":[[81538.1,14.537],[81538.2,0.737],"…"]}
```


### D004 — BTCUSDT bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/live_bars_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed 60-second bar.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **10 files; 5,594,524 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T00:00:00.256489+00:00` / `2026-10-17T14:10:00.405481+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 633,904; 2026-10-12: 643,763; 2026-10-13: 641,375; 2026-10-14: 643,801; 2026-10-15: 657,339; 2026-10-16: 659,126; 2026-10-17: 378,922.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features/live_bars_60s_2026-10-16.csv`; inspected file: `~/data/features/live_bars_60s_2026-10-16.csv`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-16T00:00:00Z","t_ms":"1792108800000","open":"82195.3","high":"82207.4","low":"82181.5","close":"82203.4","volume":"67.142","bought":"40.841","sold":"26.301","…":"shortened"}
```


### D005 — BTCUSDT events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/live_events_*.jsonl`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one typed derived event.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **10 files; 6,598,544 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-08T23:57:00.386592+00:00` / `2026-10-17T14:10:00.405481+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 438,054; 2026-10-12: 1,091,256; 2026-10-13: 806,678; 2026-10-14: 1,008,686; 2026-10-15: 1,195,383; 2026-10-16: 789,480; 2026-10-17: 207,664.
- Rows/hour: 242.33 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features/live_events_2026-10-16.jsonl`; inspected file: `~/data/features/live_events_2026-10-16.jsonl`; rows: `5816`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S005](#schema-s005). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195198681]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"velocity","t":1792108800000,"time":"2026-10-16T00:00:00Z","ratio":26.7,"side":"buy","price":82188.7}
```


### D006 — BTCUSDT footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/live_footprint_*.jsonl.gz`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one 60-second price-binned footprint.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **10 files; 1,220,901 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T00:00:03.383505+00:00` / `2026-10-17T14:10:00.406482+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 82,653; 2026-10-12: 151,870; 2026-10-13: 169,748; 2026-10-14: 174,401; 2026-10-15: 216,507; 2026-10-16: 164,415; 2026-10-17: 41,396.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features/live_footprint_60s_2026-10-16.jsonl.gz`; inspected file: `~/data/features/live_footprint_60s_2026-10-16.jsonl.gz`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195140000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792108800000,"step":5.0,"lv":[[82205.0,8.96,"…"],[82200.0,6.565,"…"],"…"]}
```


### D007 — BTCUSDT profiles

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/all_prices_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one session price level.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 6,375,330 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T00:00:00.265489+00:00` / `2026-10-17T00:00:00.344180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 505,056; 2026-10-12: 940,669; 2026-10-13: 1,115,157; 2026-10-14: 972,643; 2026-10-15: 1,046,306; 2026-10-16: 760,543; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features/all_prices_2026-10-16.csv`; inspected file: `~/data/features/all_prices_2026-10-16.csv`; rows: `21177`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S007](#schema-s007). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Price":"81700.0","Volume":"522.644","Trades":"490","Bid":"115.694","Asks":"406.950","Delta":"291.256"}
```


### D008 — BTCUSDT sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/live_sessions.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed session.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,203 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.277181+00:00` / `2026-10-17T00:00:00.277181+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.277181+00:00` / `2026-10-17T00:00:00.277181+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,203.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features/live_sessions.csv`; rows: `9`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-08","open":"81642.0","high":"81909.8","low":"81570.6","close":"81711.0","volume":"6822.214","bought":"3452.055","sold":"3370.159","delta":"81.896","…":"shortened"}
```


### D009 — BTCUSDT live snapshot

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/live.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one bounded latest dashboard object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 363,366 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T14:10:37.687332+00:00` / `2026-10-17T14:10:37.687332+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T14:10:37.687332+00:00` / `2026-10-17T14:10:37.687332+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 363,366.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features/live.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S009](#schema-s009). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generated":1792246237652,"tf":60,"status":{"last_price":81485.3,"velocity":0.4,"bar":{"t":1792246200000,"open":81473.9,"high":81489.0,"low":81473.8,"close":81485.3,"volume":9.887,"bought":5.041,"sold":4.846,"delta":0.195,"…":"shortened"},"bar_fp":{"t":1792246200000,"step":5.0,"lv":["…","…","…"]},"session":{"day":"2026-10-17","open":81578.3,"high":81733.0,"low":81373.3,"volume":17441.881,"cvd":-1580.267,"vwap":81562.5,"sd":74.73,"poc":81592.0,"…":"shortened"},"prev_day":{"high":82900.5,"low":80780.0,"poc":81700.0,"vah":82425.0,"val":81381.0,"vwap":81826.1},"naked":[83357.3],"mark":{"mark":81487.2,"index":81521.9,"funding":"0.00003918","next_funding":1792252800000},"oi":94462.102,"…":"shortened"},"bars":[{"t_ms":1792203000000.0,"open":81595.7,"high":81627.0,"low":81595.7,"close":81627.0,"volume":12.423,"bought":11.564,"sold":0.859,"delta":10.705,"…":"shortened"},{"t_ms":1792203060000.0," … [shortened]
```


### D010 — BTCUSDT engine state

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/engine_state.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one restart-state object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 971 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.344180+00:00` / `2026-10-17T00:00:00.344180+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.344180+00:00` / `2026-10-17T00:00:00.344180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 971.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features/engine_state.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S010](#schema-s010). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"prev":[{"high":81909.8,"low":81570.6,"poc":81707.6,"vah":81823.0,"val":81630.0,"vwap":81758.8},{"high":83499.9,"low":81571.5,"poc":82500.0,"vah":83070.0,"val":82278.0,"vwap":82611.2},"…"],"naked":[[83357.3,"2026-10-14"],[81700.0,"2026-10-16"]]}
```


### D011 — BTCUSDT offline bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/bars_*.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D012 — BTCUSDT offline events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/events.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D013 — BTCUSDT offline footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/footprint_*.jsonl.gz`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D014 — BTCUSDT offline sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/sessions.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D015 — BTCUSDT legacy rounded tapes

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:rebuild_tapes` → `move_existing` moves old tapes into `tape_rounded/<run>/`; original tape bytes come from the collector Recorder. This verifies the archive/move writer, not the exact historical rounded-code revision or invocation (not verified). On-demand rebuild; no scheduled trigger found.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/binance/tape_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D016 — BTCUSDT legacy rounded engine

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:move_features` → `move_existing` moves offline feature outputs into `engine_rounded/<run>/`; original feature writer is the orderflow engine. Exact historical rounded-code revision/invocation remains not verified. On-demand rebuild; no scheduled trigger found.
- Source: Local BTCUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features/engine_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D017 — ETHUSDT raw

- Purpose: Replayable received exchange payloads.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M ETHUSDT; raw stream variants above.
- Location/naming: `~/data/binance-ethusdt/raw_ETHUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one received WebSocket payload or REST response/backfilled trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 4,516,509,298 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T07:27:35.913894+00:00` / `2026-10-17T14:10:34.623345+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 312,770,592; 2026-10-12: 572,258,396; 2026-10-13: 633,880,508; 2026-10-14: 676,834,624; 2026-10-15: 838,343,864; 2026-10-16: 684,327,712; 2026-10-17: 196,134,670.
- Rows/hour: 464,717 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-ethusdt/raw_ETHUSDT_2026-10-17T11Z.jsonl.xz`; inspected file: `~/data/binance-ethusdt/raw_ETHUSDT_2026-10-17T11Z.jsonl.xz`; rows: `464717`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S011](#schema-s011). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `data.E`, `data.T`, `data.time`, `recv_ms`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"recv_ms:integer": [1792234800092, 1792238399985], "data.E:integer": [1792234799976, 1792238399854], "data.T:integer": [1792234799861, 1792252800000], "data.time:integer": [1792234802208, 1792238394191]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"recv_ms":1792234800092,"src":"ws","stream":"ethusdt@depth@100ms","data":{"e":"depthUpdate","E":1792234799976,"T":1792234799974,"s":"ETHUSDT","ps":"ETHUSDT","U":11844438048194,"u":11844438053524,"pu":11844438048103,"b":[["…","…"],["…","…"],"…"],"…":"shortened"}}
```


### D018 — ETHUSDT tape

- Purpose: Trade-time signed aggression tape.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M ETHUSDT; raw stream variants above.
- Location/naming: `~/data/binance-ethusdt/tape_ETHUSDT_*.csv*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one deduplicated aggregate trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 138,344,407 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T07:27:25.816832+00:00` / `2026-10-17T14:11:09.780204+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 8,704,851; 2026-10-12: 17,031,086; 2026-10-13: 19,904,193; 2026-10-14: 21,324,844; 2026-10-15: 30,502,192; 2026-10-16: 19,927,470; 2026-10-17: 5,745,887.
- Rows/hour: 12,143 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-ethusdt/tape_ETHUSDT_2026-10-17T11Z.csv.gz`; inspected file: `~/data/binance-ethusdt/tape_ETHUSDT_2026-10-17T11Z.csv.gz`; rows: `12143`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"17.10.2026 11:00:00.025","Bids":"2438.56","column_3":"0.041","column_4":"0","column_5":"0","Ask":"2438.57","Delta":"-0.041","AggId":"3121355878","TradeTimeMs":"1792234800025"}
```


### D019 — ETHUSDT book

- Purpose: Sampled displayed-depth history.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M ETHUSDT; raw stream variants above.
- Location/naming: `~/data/binance-ethusdt/book_ETHUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one locally timed synced top-100-per-side book sample.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 467,135,111 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T06:00:00.697517+00:00` / `2026-10-17T14:11:09.781204+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 41,847,201; 2026-10-12: 59,147,485; 2026-10-13: 60,880,463; 2026-10-14: 64,588,355; 2026-10-15: 70,434,115; 2026-10-16: 65,675,844; 2026-10-17: 25,292,513.
- Rows/hour: 3,536 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-ethusdt/book_ETHUSDT_2026-10-17T12Z.jsonl.gz`; inspected file: `~/data/binance-ethusdt/book_ETHUSDT_2026-10-17T12Z.jsonl.gz`; rows: `3536`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S003](#schema-s003). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792238400738, 1792241999681]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792238400738,"u":11844688113818,"b":[[2433.32,182.277],[2433.31,0.018],"…"],"a":[[2433.33,89.91],[2433.34,1.242],"…"]}
```


### D020 — ETHUSDT bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/live_bars_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed 60-second bar.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 5,357,182 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.294908+00:00` / `2026-10-17T14:11:00.393241+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 652,055; 2026-10-12: 669,039; 2026-10-13: 664,556; 2026-10-14: 670,018; 2026-10-15: 671,997; 2026-10-16: 676,427; 2026-10-17: 394,210.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-ethusdt/live_bars_60s_2026-10-16.csv`; inspected file: `~/data/features-ethusdt/live_bars_60s_2026-10-16.csv`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-16T00:00:00Z","t_ms":"1792108800000","open":"2441.0","high":"2442.07","low":"2440.53","close":"2441.0","volume":"1263.813","bought":"693.456","sold":"570.357","…":"shortened"}
```


### D021 — ETHUSDT events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/live_events_*.jsonl`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one typed derived event.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 53,744,203 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.294908+00:00` / `2026-10-17T14:11:00.393241+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 3,497,005; 2026-10-12: 7,505,332; 2026-10-13: 6,973,279; 2026-10-14: 7,019,561; 2026-10-15: 6,826,423; 2026-10-16: 11,034,022; 2026-10-17: 3,935,395.
- Rows/hour: 4,027.42 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-ethusdt/live_events_2026-10-16.jsonl`; inspected file: `~/data/features-ethusdt/live_events_2026-10-16.jsonl`; rows: `96658`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S012](#schema-s012). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800762, 1792195196929]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"wall_added","t":1792108800762,"time":"2026-10-16T00:00:00Z","side":"ask","price":2440.54,"qty":199.146}
```


### D022 — ETHUSDT footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/live_footprint_*.jsonl.gz`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one 60-second price-binned footprint.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 1,423,713 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.583910+00:00` / `2026-10-17T14:11:00.393241+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 112,646; 2026-10-12: 188,217; 2026-10-13: 206,723; 2026-10-14: 212,360; 2026-10-15: 261,213; 2026-10-16: 204,838; 2026-10-17: 63,695.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-ethusdt/live_footprint_60s_2026-10-16.jsonl.gz`; inspected file: `~/data/features-ethusdt/live_footprint_60s_2026-10-16.jsonl.gz`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195140000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792108800000,"step":0.2,"lv":[[2442.0,57.616,"…"],[2441.8,19.78,"…"],"…"]}
```


### D023 — ETHUSDT profiles

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/all_prices_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one session price level.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 3,320,695 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:31:50.916203+00:00` / `2026-10-17T00:00:00.520180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 238,586; 2026-10-12: 563,296; 2026-10-13: 533,899; 2026-10-14: 534,943; 2026-10-15: 638,077; 2026-10-16: 427,493; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/all_prices_2026-10-16.csv`; inspected file: `~/data/features-ethusdt/all_prices_2026-10-16.csv`; rows: `10133`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S007](#schema-s007). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Price":"2440.00","Volume":"12515.094","Trades":"469","Bid":"5573.114","Asks":"6941.980","Delta":"1368.866"}
```


### D024 — ETHUSDT sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/live_sessions.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed session.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,103 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.479180+00:00` / `2026-10-17T00:00:00.479180+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.479180+00:00` / `2026-10-17T00:00:00.479180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,103.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-ethusdt/live_sessions.csv`; rows: `8`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"2489.77","high":"2519.6","low":"2472.81","close":"2486.41","volume":"1712787.275","bought":"858160.526","sold":"854626.749","delta":"3533.777","…":"shortened"}
```


### D025 — ETHUSDT live snapshot

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/live.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one bounded latest dashboard object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 366,877 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T14:11:17.676172+00:00` / `2026-10-17T14:11:17.676172+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T14:11:17.676172+00:00` / `2026-10-17T14:11:17.676172+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 366,877.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-ethusdt/live.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S013](#schema-s013). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generated":1792246277650,"tf":60,"status":{"last_price":2422.54,"velocity":0.8,"bar":{"t":1792246260000,"open":2423.17,"high":2423.18,"low":2422.54,"close":2422.54,"volume":61.089,"bought":12.504,"sold":48.585,"delta":-36.081,"…":"shortened"},"bar_fp":{"t":1792246260000,"step":0.2,"lv":["…","…","…"]},"session":{"day":"2026-10-17","open":2422.5,"high":2440.88,"low":2416.22,"volume":632626.646,"cvd":-27878.516,"vwap":2428.6,"sd":5.5,"poc":2433.0,"…":"shortened"},"prev_day":{"high":2493.48,"low":2392.14,"poc":2440.0,"vah":2465.3,"val":2412.65,"vwap":2441.4},"naked":[2350.0,2555.0],"mark":{"mark":2422.76,"index":2423.87,"funding":"0.00007574","next_funding":1792252800000},"oi":2279104.926,"…":"shortened"},"bars":[{"t_ms":1792203060000.0,"open":2425.42,"high":2425.84,"low":2425.41,"close":2425.68,"volume":603.072,"bought":403.437,"sold":199.635,"delta":203.802,"…":"shortened"},{"t_ms":17922 … [shortened]
```


### D026 — ETHUSDT engine state

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/engine_state.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one restart-state object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 872 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.521180+00:00` / `2026-10-17T00:00:00.521180+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.521180+00:00` / `2026-10-17T00:00:00.521180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 872.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-ethusdt/engine_state.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S010](#schema-s010). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"prev":[{"high":2519.6,"low":2472.81,"poc":2500.0,"vah":2504.75,"val":2485.05,"vwap":2492.93},{"high":2518.49,"low":2484.95,"poc":2508.0,"vah":2518.5,"val":2495.35,"vwap":2501.93},"…"],"naked":[[2555.0,"2026-10-12"],[2350.0,"2026-10-15"],"…"]}
```


### D027 — ETHUSDT offline bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/bars_*.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 629,226 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:31:57.869269+00:00` / `2026-10-10T06:31:57.869269+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:31:57.869269+00:00` / `2026-10-10T06:31:57.869269+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/bars_60s.csv`; inspected file: `~/data/features-ethusdt/bars_60s.csv`; rows: `1483`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-09T05:48:00Z","t_ms":"1791524880000","open":"2489.77","high":"2490.23","low":"2489.43","close":"2489.43","volume":"729.262","bought":"247.782","sold":"481.48","…":"shortened"}
```


### D028 — ETHUSDT offline events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/events.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 6,387,384 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/events.jsonl`; inspected file: `~/data/features-ethusdt/events.jsonl`; rows: `56003`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S012](#schema-s012). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791524914287, 1791613911696]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"liquidation","t":1791524914287,"time":"2026-10-09T05:48:34Z","liquidated":"long","qty":1.329,"price":2489.76}
```


### D029 — ETHUSDT offline footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/footprint_*.jsonl.gz`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 110,164 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/footprint_60s.jsonl.gz`; inspected file: `~/data/features-ethusdt/footprint_60s.jsonl.gz`; rows: `1483`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791524880000, 1791613800000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1791524880000,"step":0.2,"lv":[[2490.2,97.7,"…"],[2490.0,256.657,"…"],"…"]}
```


### D030 — ETHUSDT offline sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/sessions.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 332 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:31:57.873269+00:00` / `2026-10-10T06:31:57.873269+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/sessions.csv`; inspected file: `~/data/features-ethusdt/sessions.csv`; rows: `2`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"2489.77","high":"2519.6","low":"2472.81","close":"2486.41","volume":"1713061.401","bought":"858248.755","sold":"854812.646","delta":"3436.109","…":"shortened"}
```


### D031 — ETHUSDT legacy rounded tapes

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:rebuild_tapes` → `move_existing` moves old tapes into `tape_rounded/<run>/`; original tape bytes come from the collector Recorder. This verifies the archive/move writer, not the exact historical rounded-code revision or invocation (not verified). On-demand rebuild; no scheduled trigger found.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/binance-ethusdt/tape_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **8 files; 19,921,992 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-09T12:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T06:10:00.508513+00:00` / `2026-10-09T13:10:01.090355+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/binance-ethusdt/tape_rounded/tape_ETHUSDT_2026-10-09T12Z.csv`; inspected file: `~/data/binance-ethusdt/tape_rounded/tape_ETHUSDT_2026-10-09T12Z.csv`; rows: `44705`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"09.10.2026 12:00:00.042","Bids":"2505.00","column_3":"21.869","column_4":"0","column_5":"0","Ask":"2505.00","Delta":"-21.869","AggId":"3113371797","TradeTimeMs":"1791547200042"}
```


### D032 — ETHUSDT legacy rounded engine

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:move_features` → `move_existing` moves offline feature outputs into `engine_rounded/<run>/`; original feature writer is the orderflow engine. Exact historical rounded-code revision/invocation remains not verified. On-demand rebuild; no scheduled trigger found.
- Source: Local ETHUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-ethusdt/engine_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 22,657,396 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-09T11:33:02.111796+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T11:32:00.208442+00:00` / `2026-10-09T11:33:02.111796+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-ethusdt/engine_rounded/sessions.csv`; inspected file: `~/data/features-ethusdt/engine_rounded/sessions.csv`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"2489.77","high":"2507.75","low":"2486.37","close":"2496.4","volume":"524109.512","bought":"245471.647","sold":"278637.865","delta":"-33166.218","…":"shortened"}
```


### D033 — SOLUSDT raw

- Purpose: Replayable received exchange payloads.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M SOLUSDT; raw stream variants above.
- Location/naming: `~/data/binance-solusdt/raw_SOLUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one received WebSocket payload or REST response/backfilled trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 1,820,112,671 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T07:54:37.976730+00:00` / `2026-10-17T14:11:20.430161+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 155,260,064; 2026-10-12: 238,084,912; 2026-10-13: 267,042,940; 2026-10-14: 255,448,640; 2026-10-15: 300,050,292; 2026-10-16: 242,013,432; 2026-10-17: 85,578,863.
- Rows/hour: 216,041 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-solusdt/raw_SOLUSDT_2026-10-17T11Z.jsonl.xz`; inspected file: `~/data/binance-solusdt/raw_SOLUSDT_2026-10-17T11Z.jsonl.xz`; rows: `216041`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S011](#schema-s011). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `data.E`, `data.T`, `data.time`, `recv_ms`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"recv_ms:integer": [1792234800030, 1792238399941], "data.E:integer": [1792234799911, 1792238399819], "data.T:integer": [1792234799907, 1792252800000], "data.time:integer": [1792234803978, 1792238384750]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"recv_ms":1792234800030,"src":"ws","stream":"solusdt@depth@100ms","data":{"e":"depthUpdate","E":1792234799911,"T":1792234799907,"s":"SOLUSDT","ps":"SOLUSDT","U":11844438045687,"u":11844438049837,"pu":11844438044813,"b":[["…","…"],["…","…"],"…"],"…":"shortened"}}
```


### D034 — SOLUSDT tape

- Purpose: Trade-time signed aggression tape.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M SOLUSDT; raw stream variants above.
- Location/naming: `~/data/binance-solusdt/tape_SOLUSDT_*.csv*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one deduplicated aggregate trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 43,502,598 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T07:54:33.211701+00:00` / `2026-10-17T14:11:35.463101+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 4,173,358; 2026-10-12: 6,025,783; 2026-10-13: 6,207,973; 2026-10-14: 5,543,501; 2026-10-15: 6,529,959; 2026-10-16: 5,495,888; 2026-10-17: 2,472,860.
- Rows/hour: 4,499 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-solusdt/tape_SOLUSDT_2026-10-17T11Z.csv.gz`; inspected file: `~/data/binance-solusdt/tape_SOLUSDT_2026-10-17T11Z.csv.gz`; rows: `4499`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"17.10.2026 11:00:01.284","Bids":"104.88","column_3":"0.20","column_4":"0","column_5":"0","Ask":"104.89","Delta":"-0.200","AggId":"1106610788","TradeTimeMs":"1792234801284"}
```


### D035 — SOLUSDT book

- Purpose: Sampled displayed-depth history.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M SOLUSDT; raw stream variants above.
- Location/naming: `~/data/binance-solusdt/book_SOLUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one locally timed synced top-100-per-side book sample.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **202 files; 345,454,409 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T06:00:00.633516+00:00` / `2026-10-17T14:11:35.463101+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 34,397,064; 2026-10-12: 44,709,312; 2026-10-13: 46,584,015; 2026-10-14: 45,431,078; 2026-10-15: 48,966,506; 2026-10-16: 43,390,258; 2026-10-17: 18,744,861.
- Rows/hour: 3,588 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-solusdt/book_SOLUSDT_2026-10-17T12Z.jsonl.gz`; inspected file: `~/data/binance-solusdt/book_SOLUSDT_2026-10-17T12Z.jsonl.gz`; rows: `3588`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S003](#schema-s003). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792238400174, 1792241999471]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792238400174,"u":11844688014721,"b":[[104.6,2657.4],[104.59,993.12],"…"],"a":[[104.61,1144.25],[104.62,883.72],"…"]}
```


### D036 — SOLUSDT bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/live_bars_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed 60-second bar.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 5,072,295 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.297908+00:00` / `2026-10-17T14:11:00.364242+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 618,426; 2026-10-12: 630,070; 2026-10-13: 634,838; 2026-10-14: 630,484; 2026-10-15: 635,290; 2026-10-16: 636,938; 2026-10-17: 374,258.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-solusdt/live_bars_60s_2026-10-16.csv`; inspected file: `~/data/features-solusdt/live_bars_60s_2026-10-16.csv`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-16T00:00:00Z","t_ms":"1792108800000","open":"105.39","high":"105.44","low":"105.37","close":"105.4","volume":"7885.36","bought":"5568.46","sold":"2316.9","…":"shortened"}
```


### D037 — SOLUSDT events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/live_events_*.jsonl`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one typed derived event.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 8,718,665 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.297908+00:00` / `2026-10-17T14:10:00.486481+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 669,606; 2026-10-12: 386,502; 2026-10-13: 1,594,144; 2026-10-14: 1,604,948; 2026-10-15: 1,801,071; 2026-10-16: 469,648; 2026-10-17: 688,290.
- Rows/hour: 163.88 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-solusdt/live_events_2026-10-16.jsonl`; inspected file: `~/data/features-solusdt/live_events_2026-10-16.jsonl`; rows: `3933`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S012](#schema-s012). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195173342]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"velocity","t":1792108800000,"time":"2026-10-16T00:00:00Z","ratio":31.6,"side":"buy","price":105.4}
```


### D038 — SOLUSDT footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/live_footprint_*.jsonl.gz`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one 60-second price-binned footprint.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 1,433,140 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:01.321915+00:00` / `2026-10-17T14:11:00.364242+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 128,347; 2026-10-12: 190,949; 2026-10-13: 217,660; 2026-10-14: 206,182; 2026-10-15: 244,699; 2026-10-16: 194,972; 2026-10-17: 66,792.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-solusdt/live_footprint_60s_2026-10-16.jsonl.gz`; inspected file: `~/data/features-solusdt/live_footprint_60s_2026-10-16.jsonl.gz`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195140000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792108800000,"step":0.01,"lv":[[105.44,0.0,"…"],[105.43,367.96,"…"],"…"]}
```


### D039 — SOLUSDT profiles

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/all_prices_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one session price level.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 209,543 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:32:43.575695+00:00` / `2026-10-17T00:00:00.177181+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 19,023; 2026-10-12: 39,532; 2026-10-13: 36,602; 2026-10-14: 25,968; 2026-10-15: 29,731; 2026-10-16: 24,715; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/all_prices_2026-10-16.csv`; inspected file: `~/data/features-solusdt/all_prices_2026-10-16.csv`; rows: `498`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S007](#schema-s007). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Price":"105.80","Volume":"114017.130","Trades":"668","Bid":"90275.790","Asks":"23741.340","Delta":"-66534.450"}
```


### D040 — SOLUSDT sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/live_sessions.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed session.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,042 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.172181+00:00` / `2026-10-17T00:00:00.172181+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.172181+00:00` / `2026-10-17T00:00:00.172181+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,042.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-solusdt/live_sessions.csv`; rows: `8`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"110.28","high":"112.05","low":"108.41","close":"109.07","volume":"10678874.6","bought":"5230742.55","sold":"5448132.05","delta":"-217389.5","…":"shortened"}
```


### D041 — SOLUSDT live snapshot

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/live.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one bounded latest dashboard object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 367,608 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T14:11:42.015075+00:00` / `2026-10-17T14:11:42.015075+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T14:11:42.015075+00:00` / `2026-10-17T14:11:42.015075+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 367,608.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-solusdt/live.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S014](#schema-s014). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generated":1792246301969,"tf":60,"status":{"last_price":103.96,"velocity":0.6,"bar":{"t":1792246260000,"open":103.96,"high":103.96,"low":103.9,"close":103.96,"volume":1726.44,"bought":893.22,"sold":833.22,"delta":60.0,"…":"shortened"},"bar_fp":{"t":1792246260000,"step":0.01,"lv":["…","…","…"]},"session":{"day":"2026-10-17","open":104.4,"high":105.24,"low":103.74,"volume":3371734.02,"cvd":-293331.94,"vwap":104.56,"sd":0.38,"poc":104.96,"…":"shortened"},"prev_day":{"high":107.37,"low":102.43,"poc":105.8,"vah":106.95,"val":104.11,"vwap":105.04},"naked":[102.0,105.8,"…"],"mark":{"mark":103.95,"index":103.99,"funding":"0.00001589","next_funding":1792252800000},"oi":8852350.85,"…":"shortened"},"bars":[{"t_ms":1792203060000.0,"open":104.76,"high":104.81,"low":104.76,"close":104.79,"volume":8931.54,"bought":4972.55,"sold":3958.99,"delta":1013.56,"…":"shortened"},{"t_ms":1792203120000.0,"open": … [shortened]
```


### D042 — SOLUSDT engine state

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/engine_state.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one restart-state object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 835 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.177181+00:00` / `2026-10-17T00:00:00.177181+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.177181+00:00` / `2026-10-17T00:00:00.177181+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 835.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-solusdt/engine_state.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S010](#schema-s010). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"prev":[{"high":112.05,"low":108.41,"poc":109.71,"vah":110.5,"val":108.94,"vwap":109.93},{"high":110.75,"low":108.9,"poc":110.0,"vah":110.38,"val":109.62,"vwap":109.96},"…"],"naked":[[111.61,"2026-10-12"],[102.0,"2026-10-15"],"…"]}
```


### D043 — SOLUSDT offline bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/bars_*.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 602,757 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:32:48.812743+00:00` / `2026-10-10T06:32:48.812743+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:32:48.812743+00:00` / `2026-10-10T06:32:48.812743+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/bars_60s.csv`; inspected file: `~/data/features-solusdt/bars_60s.csv`; rows: `1484`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-09T05:48:00Z","t_ms":"1791524880000","open":"110.28","high":"110.29","low":"110.24","close":"110.25","volume":"7801.98","bought":"996.71","sold":"6805.27","…":"shortened"}
```


### D044 — SOLUSDT offline events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/events.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,234,258 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/events.jsonl`; inspected file: `~/data/features-solusdt/events.jsonl`; rows: `10751`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S005](#schema-s005). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791524880000, 1791613967441]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"big_trade","t":1791524933308,"time":"2026-10-09T05:48:53Z","side":"sell","qty":4870.5,"avg_price":110.26,"from":110.24,"to":110.28,"levels":5}
```


### D045 — SOLUSDT offline footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/footprint_*.jsonl.gz`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 127,988 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/footprint_60s.jsonl.gz`; inspected file: `~/data/features-solusdt/footprint_60s.jsonl.gz`; rows: `1484`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791524880000, 1791613860000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1791524880000,"step":0.01,"lv":[[110.29,0.0,"…"],[110.28,1831.63,"…"],"…"]}
```


### D046 — SOLUSDT offline sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/sessions.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 317 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:32:48.813744+00:00` / `2026-10-10T06:32:48.813744+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/sessions.csv`; inspected file: `~/data/features-solusdt/sessions.csv`; rows: `2`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"110.28","high":"112.05","low":"108.41","close":"109.07","volume":"10680519.13","bought":"5231285.91","sold":"5449233.22","delta":"-217947.31","…":"shortened"}
```


### D047 — SOLUSDT legacy rounded tapes

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:rebuild_tapes` → `move_existing` moves old tapes into `tape_rounded/<run>/`; original tape bytes come from the collector Recorder. This verifies the archive/move writer, not the exact historical rounded-code revision or invocation (not verified). On-demand rebuild; no scheduled trigger found.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/binance-solusdt/tape_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **8 files; 6,311,552 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T05:00:00+00:00` / `2026-10-09T12:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T06:10:00.141511+00:00` / `2026-10-09T13:10:01.191356+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/binance-solusdt/tape_rounded/tape_SOLUSDT_2026-10-09T12Z.csv`; inspected file: `~/data/binance-solusdt/tape_rounded/tape_SOLUSDT_2026-10-09T12Z.csv`; rows: `12102`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"09.10.2026 12:00:00.075","Bids":"111.2200","column_3":"53.38","column_4":"0","column_5":"0","Ask":"111.2200","Delta":"-53.380","AggId":"1104445051","TradeTimeMs":"1791547200075"}
```


### D048 — SOLUSDT legacy rounded engine

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:move_features` → `move_existing` moves offline feature outputs into `engine_rounded/<run>/`; original feature writer is the orderflow engine. Exact historical rounded-code revision/invocation remains not verified. On-demand rebuild; no scheduled trigger found.
- Source: Local SOLUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-solusdt/engine_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 4,358,155 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-09T11:33:10.801846+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T11:32:00.279442+00:00` / `2026-10-09T11:33:10.801846+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-solusdt/engine_rounded/sessions.csv`; inspected file: `~/data/features-solusdt/engine_rounded/sessions.csv`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"110.28","high":"110.81","low":"109.3","close":"110.3","volume":"2783256.73","bought":"1395792.44","sold":"1387464.29","delta":"8328.15","…":"shortened"}
```


### D049 — HYPEUSDT raw

- Purpose: Replayable received exchange payloads.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M HYPEUSDT; raw stream variants above.
- Location/naming: `~/data/binance-hypeusdt/raw_HYPEUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one received WebSocket payload or REST response/backfilled trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **201 files; 1,760,115,006 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T06:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T08:07:53.892642+00:00` / `2026-10-17T14:11:42.698072+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 141,325,424; 2026-10-12: 230,424,272; 2026-10-13: 256,077,552; 2026-10-14: 253,811,136; 2026-10-15: 285,625,160; 2026-10-16: 238,049,856; 2026-10-17: 83,571,958.
- Rows/hour: 202,554 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-17T11Z.jsonl.xz`; inspected file: `~/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-17T11Z.jsonl.xz`; rows: `202554`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S011](#schema-s011). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `data.E`, `data.T`, `data.time`, `recv_ms`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"recv_ms:integer": [1792234800039, 1792238399961], "data.T:integer": [1792234799913, 1792238400000], "data.E:integer": [1792234799913, 1792238399841], "data.time:integer": [1792234802931, 1792238395381]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"recv_ms":1792234800039,"src":"ws","stream":"hypeusdt@bookTicker","data":{"e":"bookTicker","u":11844438050111,"s":"HYPEUSDT","ps":"HYPEUSDT","b":"79.80300","B":"63.14","a":"79.80400","A":"78.81","T":1792234799913,"…":"shortened"}}
```


### D050 — HYPEUSDT tape

- Purpose: Trade-time signed aggression tape.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M HYPEUSDT; raw stream variants above.
- Location/naming: `~/data/binance-hypeusdt/tape_HYPEUSDT_*.csv*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one deduplicated aggregate trade.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **201 files; 61,733,804 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T06:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T08:07:42.682572+00:00` / `2026-10-17T14:11:57.734012+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 4,299,608; 2026-10-12: 8,035,604; 2026-10-13: 9,171,454; 2026-10-14: 8,690,014; 2026-10-15: 11,512,728; 2026-10-16: 8,379,001; 2026-10-17: 2,978,578.
- Rows/hour: 9,791 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-17T11Z.csv.gz`; inspected file: `~/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-17T11Z.csv.gz`; rows: `9791`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"17.10.2026 11:00:00.582","Bids":"79.803","column_3":"1.56","column_4":"0","column_5":"0","Ask":"79.804","Delta":"-1.560","AggId":"273759489","TradeTimeMs":"1792234800582"}
```


### D051 — HYPEUSDT book

- Purpose: Sampled displayed-depth history.
- Producer: `tools/collector/binance_live.py` (sha256 `130c9a650043`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M HYPEUSDT; raw stream variants above.
- Location/naming: `~/data/binance-hypeusdt/book_HYPEUSDT_*.jsonl.*`.
- Rotation/compression/retention: `hour`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one locally timed synced top-100-per-side book sample.
- Consumers: orderflow_engine.py, dashboard.py, trade_time_tapes.py, data_checks.py, storage_maintenance.py, archive_upload.py, tools/alert-eval/shadow_trades.py.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **201 files; 402,534,848 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T06:00:00+00:00` / `2026-10-17T14:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T07:00:00.172212+00:00` / `2026-10-17T14:11:57.734012+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 38,005,887; 2026-10-12: 51,864,787; 2026-10-13: 55,583,085; 2026-10-14: 54,781,373; 2026-10-15: 57,093,072; 2026-10-16: 54,417,908; 2026-10-17: 22,353,895.
- Rows/hour: 3,565 rows/hour in sampled closed hourly partition.
- Newest eligible complete file: `~/data/binance-hypeusdt/book_HYPEUSDT_2026-10-17T12Z.jsonl.gz`; inspected file: `~/data/binance-hypeusdt/book_HYPEUSDT_2026-10-17T12Z.jsonl.gz`; rows: `3565`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S003](#schema-s003). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792238400542, 1792241999396]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792238400542,"u":11844688095067,"b":[[78.943,102.59],[78.942,10.2],"…"],"a":[[78.944,34.74],[78.945,0.07],"…"]}
```


### D052 — HYPEUSDT bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/live_bars_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed 60-second bar.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 4,921,869 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.499910+00:00` / `2026-10-17T14:12:00.287001+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 612,441; 2026-10-12: 609,193; 2026-10-13: 609,269; 2026-10-14: 609,941; 2026-10-15: 610,593; 2026-10-16: 609,424; 2026-10-17: 359,467.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-hypeusdt/live_bars_60s_2026-10-16.csv`; inspected file: `~/data/features-hypeusdt/live_bars_60s_2026-10-16.csv`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-16T00:00:00Z","t_ms":"1792108800000","open":"81.766","high":"81.824","low":"81.766","close":"81.818","volume":"4226.27","bought":"3161.84","sold":"1064.43","…":"shortened"}
```


### D053 — HYPEUSDT events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/live_events_*.jsonl`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one typed derived event.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 9,053,419 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:00.499910+00:00` / `2026-10-17T14:12:00.287001+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 1,778,248; 2026-10-12: 1,450,148; 2026-10-13: 1,091,335; 2026-10-14: 1,060,134; 2026-10-15: 745,369; 2026-10-16: 490,496; 2026-10-17: 136,296.
- Rows/hour: 163.04 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-hypeusdt/live_events_2026-10-16.jsonl`; inspected file: `~/data/features-hypeusdt/live_events_2026-10-16.jsonl`; rows: `3913`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S005](#schema-s005). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195080000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"big_trade","t":1792108800720,"time":"2026-10-16T00:00:00Z","side":"buy","qty":695.67,"avg_price":81.788,"from":81.779,"to":81.797,"levels":15}
```


### D054 — HYPEUSDT footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/live_footprint_*.jsonl.gz`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one 60-second price-binned footprint.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 1,961,512 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-17T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T00:00:02.982926+00:00` / `2026-10-17T14:12:00.287001+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 169,873; 2026-10-12: 259,860; 2026-10-13: 282,966; 2026-10-14: 289,743; 2026-10-15: 337,506; 2026-10-16: 269,765; 2026-10-17: 92,270.
- Rows/hour: 60.00 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/data/features-hypeusdt/live_footprint_60s_2026-10-16.jsonl.gz`; inspected file: `~/data/features-hypeusdt/live_footprint_60s_2026-10-16.jsonl.gz`; rows: `1440`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1792108800000, 1792195140000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1792108800000,"step":0.005,"lv":[[81.82,112.61,"…"],[81.815,133.07,"…"],"…"]}
```


### D055 — HYPEUSDT profiles

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/all_prices_*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one session price level.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 1,470,784 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:33:29.123110+00:00` / `2026-10-17T00:00:00.329180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 114,457; 2026-10-12: 308,335; 2026-10-13: 175,969; 2026-10-14: 163,759; 2026-10-15: 225,783; 2026-10-16: 177,236; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/all_prices_2026-10-16.csv`; inspected file: `~/data/features-hypeusdt/all_prices_2026-10-16.csv`; rows: `4058`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S007](#schema-s007). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Price":"80.950","Volume":"22557.380","Trades":"268","Bid":"20076.030","Asks":"2481.350","Delta":"-17594.680"}
```


### D056 — HYPEUSDT sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/live_sessions.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one closed session.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,021 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.307181+00:00` / `2026-10-17T00:00:00.307181+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.307181+00:00` / `2026-10-17T00:00:00.307181+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,021.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-hypeusdt/live_sessions.csv`; rows: `8`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"85.588","high":"86.588","low":"83.375","close":"84.171","volume":"3567406.3","bought":"1658133.19","sold":"1909273.11","delta":"-251139.92","…":"shortened"}
```


### D057 — HYPEUSDT live snapshot

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/live.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one bounded latest dashboard object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 369,251 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T14:12:02.655992+00:00` / `2026-10-17T14:12:02.655992+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T14:12:02.655992+00:00` / `2026-10-17T14:12:02.655992+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 369,251.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-hypeusdt/live.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S009](#schema-s009). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generated":1792246322612,"tf":60,"status":{"last_price":78.811,"velocity":0.3,"bar":{"t":1792246320000,"open":78.805,"high":78.811,"low":78.805,"close":78.811,"volume":64.44,"bought":64.44,"sold":0.0,"delta":64.44,"…":"shortened"},"bar_fp":{"t":1792246320000,"step":0.005,"lv":["…","…"]},"session":{"day":"2026-10-17","open":80.338,"high":80.459,"low":78.528,"volume":1359780.33,"cvd":-395.79,"vwap":79.595,"sd":0.53,"poc":79.841,"…":"shortened"},"prev_day":{"high":82.493,"low":78.436,"poc":80.95,"vah":82.316,"val":79.5,"vwap":80.433},"naked":[80.95],"mark":{"mark":78.809,"index":78.831,"funding":"0.00001920","next_funding":1792252800000},"oi":4962605.64,"…":"shortened"},"bars":[{"t_ms":1792203120000.0,"open":80.108,"high":80.11,"low":80.088,"close":80.094,"volume":656.19,"bought":301.05,"sold":355.14,"delta":-54.09,"…":"shortened"},{"t_ms":1792203180000.0,"open":80.096,"high":80.096,"low" … [shortened]
```


### D058 — HYPEUSDT engine state

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/engine_state.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one restart-state object.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 778 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T00:00:00.330180+00:00` / `2026-10-17T00:00:00.330180+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T00:00:00.330180+00:00` / `2026-10-17T00:00:00.330180+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 778.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/features-hypeusdt/engine_state.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S010](#schema-s010). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"prev":[{"high":86.588,"low":83.375,"poc":85.703,"vah":86.388,"val":84.664,"vwap":85.129},{"high":86.792,"low":83.704,"poc":86.197,"vah":86.794,"val":84.33,"vwap":85.099},"…"],"naked":[[80.95,"2026-10-16"]]}
```


### D059 — HYPEUSDT offline bars

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/bars_*.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 579,881 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:33:34.469158+00:00` / `2026-10-10T06:33:34.469158+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:33:34.469158+00:00` / `2026-10-10T06:33:34.469158+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/bars_60s.csv`; inspected file: `~/data/features-hypeusdt/bars_60s.csv`; rows: `1445`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S004](#schema-s004). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":"2026-10-09T06:28:00Z","t_ms":"1791527280000","open":"85.588","high":"85.589","low":"85.588","close":"85.589","volume":"2.01","bought":"0.22","sold":"1.79","…":"shortened"}
```


### D060 — HYPEUSDT offline events

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/events.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 1,968,899 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/events.jsonl`; inspected file: `~/data/features-hypeusdt/events.jsonl`; rows: `17173`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S012](#schema-s012). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791527345749, 1791614002657]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"type":"wall_added","t":1791527345749,"time":"2026-10-09T06:29:05Z","side":"ask","price":85.667,"qty":1202.42}
```


### D061 — HYPEUSDT offline footprints

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/footprint_*.jsonl.gz`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 161,933 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/footprint_60s.jsonl.gz`; inspected file: `~/data/features-hypeusdt/footprint_60s.jsonl.gz`; rows: `1445`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S006](#schema-s006). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `t`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"t:integer": [1791527280000, 1791613920000]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"t":1791527280000,"step":0.005,"lv":[[85.585,1.79,"…"]]}
```


### D062 — HYPEUSDT offline sessions

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/orderflow_engine.py` (sha256 `609790f4a307`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/sessions.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **1 files; 315 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:33:34.474158+00:00` / `2026-10-10T06:33:34.474158+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/sessions.csv`; inspected file: `~/data/features-hypeusdt/sessions.csv`; rows: `2`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"85.588","high":"86.588","low":"83.375","close":"84.171","volume":"3567999.59","bought":"1658394.52","sold":"1909605.07","delta":"-251210.55","…":"shortened"}
```


### D063 — HYPEUSDT legacy rounded tapes

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:rebuild_tapes` → `move_existing` moves old tapes into `tape_rounded/<run>/`; original tape bytes come from the collector Recorder. This verifies the archive/move writer, not the exact historical rounded-code revision or invocation (not verified). On-demand rebuild; no scheduled trigger found.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/binance-hypeusdt/tape_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **7 files; 6,470,725 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T06:00:00+00:00` / `2026-10-09T12:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T07:10:00.449159+00:00` / `2026-10-09T13:10:01.212356+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/binance-hypeusdt/tape_rounded/tape_HYPEUSDT_2026-10-09T12Z.csv`; inspected file: `~/data/binance-hypeusdt/tape_rounded/tape_HYPEUSDT_2026-10-09T12Z.csv`; rows: `16464`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S002](#schema-s002). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"Time":"09.10.2026 12:00:00.077","Bids":"86.15000","column_3":"8.09","column_4":"0","column_5":"0","Ask":"86.15000","Delta":"-8.090","AggId":"270347001","TradeTimeMs":"1791547200077"}
```


### D064 — HYPEUSDT legacy rounded engine

- Purpose: Derived orderflow, profile or restart state.
- Producer: `tools/collector/rebuild_from_raw.py:move_features` → `move_existing` moves offline feature outputs into `engine_rounded/<run>/`; original feature writer is the orderflow engine. Exact historical rounded-code revision/invocation remains not verified. On-demand rebuild; no scheduled trigger found.
- Source: Local HYPEUSDT USD-M trades/raw/book through orderflow_engine.py.
- Location/naming: `~/data/features-hypeusdt/engine_rounded/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one offline/legacy feature record.
- Consumers: dashboard.py; realtime-market-watcher.mjs feature enrichment; replay/analysis tools.
- Known gaps/caps: Raw receive-hour vs tape exchange-trade-hour differs. See forceOrder cap, sampled depth, backfill and retention limits above. Derived features may omit late REST backfill during live operation (engine live feed gated to src=ws).
- Observed size: **9 files; 39,582,964 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T00:00:00+00:00` / `2026-10-09T11:33:17.372883+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T11:32:00.227442+00:00` / `2026-10-09T11:33:17.372883+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/data/features-hypeusdt/engine_rounded/sessions.csv`; inspected file: `~/data/features-hypeusdt/engine_rounded/sessions.csv`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S008](#schema-s008). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"day":"2026-10-09","open":"85.588","high":"86.227","low":"85.524","close":"85.9","volume":"814055.92","bought":"403538.68","sold":"410517.24","delta":"-6978.56","…":"shortened"}
```


### D065 — Binance Vision research trades

- Purpose: Historical public trade archive and provenance.
- Producer: `~/.openclaw/workspace/scripts/a2b_history_proof.py` (sha256 `46f2450b10c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: data.binance.vision/data/futures/um/daily/aggTrades or public.bybit.com/trading; BTCUSDT/ETHUSDT/SOLUSDT/HYPEUSDT/ZECUSDT.
- Location/naming: box `research/ralph-research-data/binance-vision/*.zip`; original local root `~/ralph-research-data/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/ralph-research-data/` to `~/ralph-research-data/`, preserving relative paths and existing compression. The a2c scripts need S2 restored first.
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one archive aggregate trade (Binance), public trade (Bybit), checksum line or manifest file entry.
- Consumers: tools/alert-eval/{shadow_trades,velocity_trades,velocity_excursions,export_velocity_alerts}.py.
- Known gaps/caps: Archive day coverage is finite; manifest verifies download checksums/own hashes, not completeness of strategy inputs. Initial/extended download command identity may differ from inspected script.
- Observed size: **108 files; 1,470,566,550 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T00:00:00+00:00` / `2026-10-13T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T07:15:26.557776+00:00` / `2026-10-14T08:36:02.412612+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 12,729,662; 2026-10-12: 31,201,613; 2026-10-13: 21,038,735; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-research-data/binance-vision/SOLUSDT-aggTrades-2026-10-13.zip`; inspected file: `~/ralph-research-data/binance-vision/SOLUSDT-aggTrades-2026-10-13.zip`; rows: `321591`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S015](#schema-s015). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"agg_trade_id":"1105301624","price":"105.69","quantity":"15.33","first_trade_id":"3587035647","last_trade_id":"3587035647","transact_time":"1791849600005","is_buyer_maker":"true"}
```


### D066 — Binance Vision checksums

- Purpose: Historical public trade archive and provenance.
- Producer: `~/.openclaw/workspace/scripts/a2b_history_proof.py` (sha256 `46f2450b10c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: data.binance.vision/data/futures/um/daily/aggTrades or public.bybit.com/trading; BTCUSDT/ETHUSDT/SOLUSDT/HYPEUSDT/ZECUSDT.
- Location/naming: box `research/ralph-research-data/binance-vision/*.CHECKSUM`; original local root `~/ralph-research-data/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/ralph-research-data/` to `~/ralph-research-data/`, preserving relative paths and existing compression. The a2c scripts need S2 restored first.
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one archive aggregate trade (Binance), public trade (Bybit), checksum line or manifest file entry.
- Consumers: tools/alert-eval/{shadow_trades,velocity_trades,velocity_excursions,export_velocity_alerts}.py.
- Known gaps/caps: Archive day coverage is finite; manifest verifies download checksums/own hashes, not completeness of strategy inputs. Initial/extended download command identity may differ from inspected script.
- Observed size: **108 files; 10,728 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T00:00:00+00:00` / `2026-10-13T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T07:15:27.237780+00:00` / `2026-10-14T08:36:00.536619+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 198; 2026-10-12: 297; 2026-10-13: 198; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-research-data/binance-vision/SOLUSDT-aggTrades-2026-10-13.zip.CHECKSUM`; inspected file: `~/ralph-research-data/binance-vision/SOLUSDT-aggTrades-2026-10-13.zip.CHECKSUM`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D067 — Bybit public research trades

- Purpose: Historical public trade archive and provenance.
- Producer: `~/.openclaw/workspace/scripts/a2b_history_proof.py` (sha256 `46f2450b10c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: data.binance.vision/data/futures/um/daily/aggTrades or public.bybit.com/trading; BTCUSDT/ETHUSDT/SOLUSDT/HYPEUSDT/ZECUSDT.
- Location/naming: box `research/ralph-research-data/bybit-public/*.csv.gz`; original local root `~/ralph-research-data/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/ralph-research-data/` to `~/ralph-research-data/`, preserving relative paths and existing compression. The a2c scripts need S2 restored first.
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one archive aggregate trade (Binance), public trade (Bybit), checksum line or manifest file entry.
- Consumers: tools/alert-eval/{shadow_trades,velocity_trades,velocity_excursions,export_velocity_alerts}.py.
- Known gaps/caps: Archive day coverage is finite; manifest verifies download checksums/own hashes, not completeness of strategy inputs. Initial/extended download command identity may differ from inspected script.
- Observed size: **107 files; 5,333,120,198 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T00:00:00+00:00` / `2026-10-13T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T15:42:47.734989+00:00` / `2026-10-14T08:43:22.453847+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 39,640,161; 2026-10-12: 110,218,202; 2026-10-13: 76,483,578; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-research-data/bybit-public/SOLUSDT2026-10-13.csv.gz`; inspected file: `~/ralph-research-data/bybit-public/SOLUSDT2026-10-13.csv.gz`; rows: `568373`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S016](#schema-s016). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"timestamp":"1791849600.0264","symbol":"SOLUSDT","side":"Sell","size":"0.3","price":"105.690","tickDirection":"ZeroMinusTick","trdMatchID":"48c067d5-7c4d-585b-9ea0-368b09a84386","grossValue":"3.1706999999999995e+09","homeNotional":"0.3","…":"shortened"}
```


### D068 — Bybit mark klines

- Purpose: Cross-venue mark-price basis checks.
- Producer: `~/ralph-state/a2c_bybit_crosscheck.py` (sha256 `f03d11444eb3`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Bybit /v5/market/mark-price-kline; BTCUSDT/HYPEUSDT/ZECUSDT.
- Location/naming: box `research/ralph-research-data/bybit-markkline/*.csv`; original local root `~/ralph-research-data/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/ralph-research-data/` to `~/ralph-research-data/`, preserving relative paths and existing compression. The a2c scripts need S2 restored first.
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one mark-price candle (start_ms, open, high, low, close).
- Consumers: a2c_bybit_crosscheck.py; a2c_minute_basis_remaining.py.
- Known gaps/caps: No volume; only selected days/windows. Local script not present in repo.
- Observed size: **23 files; 1,435,482 bytes**.
- First/last available file partition-or-mtime: `2026-09-03T00:00:00+00:00` / `2026-10-12T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T16:35:40.262753+00:00` / `2026-10-12T16:36:04.538644+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 69,417; 2026-10-12: 48,037; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-research-data/bybit-markkline/BTCUSDT-2026-10-12.csv`; inspected file: `~/ralph-research-data/bybit-markkline/BTCUSDT-2026-10-12.csv`; rows: `996`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S017](#schema-s017). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"start_ms":"1791763200000","open":"83733.21","high":"83740.1","low":"83722.24","close":"83728"}
```


### D069 — Research download manifest

- Purpose: Historical public trade archive and provenance.
- Producer: `~/.openclaw/workspace/scripts/a2b_history_proof.py` (sha256 `46f2450b10c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: data.binance.vision/data/futures/um/daily/aggTrades or public.bybit.com/trading; BTCUSDT/ETHUSDT/SOLUSDT/HYPEUSDT/ZECUSDT.
- Location/naming: box `research/ralph-research-data/manifest.csv`; original local root `~/ralph-research-data/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/ralph-research-data/` to `~/ralph-research-data/`, preserving relative paths and existing compression. The a2c scripts need S2 restored first.
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one archive aggregate trade (Binance), public trade (Bybit), checksum line or manifest file entry.
- Consumers: tools/alert-eval/{shadow_trades,velocity_trades,velocity_excursions,export_velocity_alerts}.py.
- Known gaps/caps: Archive day coverage is finite; manifest verifies download checksums/own hashes, not completeness of strategy inputs. Initial/extended download command identity may differ from inspected script.
- Observed size: **1 files; 44,753 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T08:43:24.053841+00:00` / `2026-10-14T08:43:24.053841+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T08:43:24.053841+00:00` / `2026-10-14T08:43:24.053841+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 44,753; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/ralph-research-data/manifest.csv`; rows: `215`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S018](#schema-s018). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"source":"binance-vision","symbol":"BTCUSDT","date":"03","file":"~/ralph-research-data/binance-vision/BTCUSDT-aggTrades-2026-09-03.zip","bytes":"21991621","sha256":"37f4135ac25f6cce4d82d38f577ccc9803619b7516d574a61afaa9db856254ca","checksum_status":"verified","rows":"1806935"}
```


### D070 — Archive upload ledger

- Purpose: Operational verification/state.
- Producer: `tools/collector/archive_upload.py` (sha256 `1a01ff6b951e`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local filesystem/check results; remote hash verification in normal uploader operation, no exchange source.
- Location/naming: `~/ralph-state/archive-files.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one verified file-upload result.
- Consumers: storage_maintenance.py / operator; archive_upload.py for upload state.
- Known gaps/caps: Historical invocation/coverage and retention not verified; file presence is not completeness.
- Observed size: **1 files; 629,799 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T13:44:21.892699+00:00` / `2026-10-17T13:44:21.892699+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T13:44:21.892699+00:00` / `2026-10-17T13:44:21.892699+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 629,799.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/ralph-state/archive-files.csv`; rows: `2413`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S019](#schema-s019). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"verified_at_utc":"2026-10-11T15:09:56Z","symbol":"BTCUSDT","hour":"2026-10-08T21Z","kind":"raw","remote_path":"ralph/raw/BTCUSDT/2026-10-08/raw_BTCUSDT_2026-10-08T21Z.jsonl.xz","size_bytes":"11673808","local_sha256":"0af72ef0e2577d085d4bcea0de51433960b083af53dad6d6874c9f52d659b33d","remote_sha256":"0af72ef0e2577d085d4bcea0de51433960b083af53dad6d6874c9f52d659b33d","status":"PASS"}
```


### D071 — Archive lock

- Purpose: Operational verification/state.
- Producer: `tools/collector/archive_upload.py` (sha256 `1a01ff6b951e`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local filesystem/check results; remote hash verification in normal uploader operation, no exchange source.
- Location/naming: `~/ralph-state/archive-upload.lock`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: advisory lock file; not a row dataset.
- Consumers: storage_maintenance.py / operator; archive_upload.py for upload state.
- Known gaps/caps: Historical invocation/coverage and retention not verified; file presence is not completeness.
- Observed size: **1 files; 0 bytes**.
- First/last available file partition-or-mtime: `2026-10-11T17:26:04.908968+00:00` / `2026-10-11T17:26:04.908968+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-11T17:26:04.908968+00:00` / `2026-10-11T17:26:04.908968+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/ralph-state/archive-upload.lock`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D072 — Raw deletion ledger

- Purpose: Operational verification/state.
- Producer: `tools/collector/storage_maintenance.py` (sha256 `285429576f42`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local filesystem/check results; remote hash verification in normal uploader operation, no exchange source.
- Location/naming: `~/ralph-state/raw-deleted.csv`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one gated deletion audit record (no current file).
- Consumers: storage_maintenance.py / operator; archive_upload.py for upload state.
- Known gaps/caps: Historical invocation/coverage and retention not verified; file presence is not completeness.
- Observed size: **0 files; 0 bytes**.
- First/last available file partition-or-mtime: `None` / `None`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `None` / `None`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `None`; rows: `None`; read stability: `not verified`; status: no files.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D073 — Disk alert state

- Purpose: Operational verification/state.
- Producer: `tools/collector/disk_alert.py` (sha256 `ba7d36c5fc39`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local filesystem/check results; remote hash verification in normal uploader operation, no exchange source.
- Location/naming: `~/data/disk-alert*state.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest disk alert throttle state.
- Consumers: storage_maintenance.py / operator; archive_upload.py for upload state.
- Known gaps/caps: Historical invocation/coverage and retention not verified; file presence is not completeness.
- Observed size: **2 files; 348 bytes**.
- First/last available file partition-or-mtime: `2026-10-10T06:41:19.365956+00:00` / `2026-10-17T08:04:27.214293+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T06:41:19.365956+00:00` / `2026-10-17T08:04:27.214293+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 174.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/data/disk-alert-state.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S020](#schema-s020). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"last_free_pct":15.67,"last_path":"~/data","last_sent_at":1792224257.843496,"last_sent_iso":"2026-10-17T08:04:27Z","last_threshold_pct":20.0}
```


### D074 — Daily data checks

- Purpose: Operational verification/state.
- Producer: `tools/collector/data_checks.py` (sha256 `c11cd01c5cb9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local filesystem/check results; remote hash verification in normal uploader operation, no exchange source.
- Location/naming: `~/ralph-data-checks-repo/data-checks/*.csv`.
- Rotation/compression/retention: `day`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one symbol/hour verification result.
- Consumers: storage_maintenance.py / operator; archive_upload.py for upload state.
- Known gaps/caps: Historical invocation/coverage and retention not verified; file presence is not completeness.
- Observed size: **9 files; 93,669 bytes**.
- First/last available file partition-or-mtime: `2026-10-08T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-10T22:03:42.062612+00:00` / `2026-10-17T00:37:25.452913+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 11,934; 2026-10-12: 11,976; 2026-10-13: 11,967; 2026-10-14: 11,966; 2026-10-15: 11,977; 2026-10-16: 11,478; 2026-10-17: 0.
- Rows/hour: 3.83 rows/hour daily-average of sampled partition.
- Newest eligible complete file: `~/ralph-data-checks-repo/data-checks/2026-10-16.csv`; inspected file: `~/ralph-data-checks-repo/data-checks/2026-10-16.csv`; rows: `92`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S021](#schema-s021). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"symbol":"BTCUSDT","hour":"2026-10-16T00Z","first_aggTrade_id":"3487055276","last_aggTrade_id":"3487092699","trade_count":"37424","missing_id_count":"0","tape_sha256":"2e47ab90e49ec20912ec8e6113cb7d2e9a9d03cd3a7ee375090298bb51cb7faa","verify":"PASS"}
```


### D075 — Evaluation a3b-report.txt

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/a3b-report.txt`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 30,497 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T22:55:06.206537+00:00` / `2026-10-13T22:55:06.206537+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T22:55:06.206537+00:00` / `2026-10-13T22:55:06.206537+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 30,497; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/a3b-report.txt`; inspected file: `~/ralph-state/a3b-report.txt`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D076 — Evaluation a3c-report.txt

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/a3c-report.txt`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 44,283 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T07:05:37.602282+00:00` / `2026-10-14T07:05:37.602282+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T07:05:37.602282+00:00` / `2026-10-14T07:05:37.602282+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 44,283; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/a3c-report.txt`; inspected file: `~/ralph-state/a3c-report.txt`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D077 — Evaluation a3c-run.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/a3c-run.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 140 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T23:20:51.269998+00:00` / `2026-10-13T23:20:51.269998+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T23:20:51.269998+00:00` / `2026-10-13T23:20:51.269998+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 140; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/a3c-run.log`; inspected file: `~/ralph-state/a3c-run.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D078 — Evaluation a3c-run2.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/a3c-run2.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 43,024 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T06:57:59.814160+00:00` / `2026-10-14T06:57:59.814160+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T06:57:59.814160+00:00` / `2026-10-14T06:57:59.814160+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 43,024; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/a3c-run2.log`; inspected file: `~/ralph-state/a3c-run2.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D079 — Evaluation a3c-smoke.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/a3c-smoke.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 88 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T06:04:08.503222+00:00` / `2026-10-14T06:04:08.503222+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T06:04:08.503222+00:00` / `2026-10-14T06:04:08.503222+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 88; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/a3c-smoke.log`; inspected file: `~/ralph-state/a3c-smoke.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D080 — Evaluation alert-feedback-snapshot-20261014T073833Z.jsonl

Personal category only: **1 files; 1,975,601 bytes**.


### D081 — Evaluation alert-ledger.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task. pair_telegram_export.py names this file as an input only; it does not establish its producer.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/alert-ledger.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 14,898 bytes**.
- First/last available file partition-or-mtime: `2026-10-12T06:43:30.657902+00:00` / `2026-10-12T06:43:30.657902+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T06:43:30.657902+00:00` / `2026-10-12T06:43:30.657902+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 14,898; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/alert-ledger.csv`; inspected file: `~/ralph-state/alert-ledger.csv`; rows: `83`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S022](#schema-s022). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:5858","source_id":"sw-hype","version":"unknown-before-2026-09-13","version_proof":"unknown","process_start_utc":"2026-09-03T17:52:17.650Z","utc_time":"2026-09-03T17:56:42.041Z","symbol":"HYPEUSDT","side":"SHORT","mark_logged":"84.06","…":"shortened"}
```


### D082 — Evaluation alert-prices.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/alert-prices.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 7,348 bytes**.
- First/last available file partition-or-mtime: `2026-10-12T16:48:32.690426+00:00` / `2026-10-12T16:48:32.690426+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-12T16:48:32.690426+00:00` / `2026-10-12T16:48:32.690426+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 7,348; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/alert-prices.csv`; inspected file: `~/ralph-state/alert-prices.csv`; rows: `82`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S023](#schema-s023). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-btc-82k:5890","utc_time":"2026-09-03T19:11:07.484Z","symbol":"BTCUSDT","mark_logged":"81257.1","bybit_trade_price":"81257.9","binance_trade_price":"81252.4","bybit_trade_vs_mark_bps":"0.098453","binance_vs_bybit_trade_bps":"0.676857"}
```


### D083 — Evaluation alert-texts-export.csv

Personal category only: **1 files; 8,414 bytes**.


### D084 — Evaluation alerts-for-eval.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/build_eval_input.py` (sha256 `cb3c19b1b8e8`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/alerts-for-eval.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 17,173 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T21:27:01.891272+00:00` / `2026-10-13T21:27:01.891272+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T21:27:01.891272+00:00` / `2026-10-13T21:27:01.891272+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 17,173; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/alerts-for-eval.csv`; inspected file: `~/ralph-state/alerts-for-eval.csv`; rows: `83`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S022](#schema-s022). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:5858","source_id":"sw-hype","version":"unknown-before-2026-09-13","version_proof":"unknown","process_start_utc":"2026-09-03T17:52:17.650Z","utc_time":"2026-09-03T17:56:42.041Z","symbol":"HYPEUSDT","side":"SHORT","mark_logged":"84.06","…":"shortened"}
```


### D085 — Evaluation shadow-trades-a3a-run1.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/shadow_trades.py` (sha256 `36362974d16b`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/shadow-trades-a3a-run1.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 371,817 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T12:27:30.455660+00:00` / `2026-10-13T12:27:30.455660+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T12:27:30.455660+00:00` / `2026-10-13T12:27:30.455660+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 371,817; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/shadow-trades-a3a-run1.csv`; inspected file: `~/ralph-state/shadow-trades-a3a-run1.csv`; rows: `1728`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S024](#schema-s024). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:6162","source_id":"sw-hype","version":"unknown-before-2026-09-13","variant":"delay=5s|timeout=4h|exit=TP1-only","tp_mode":"as_sent","price_path":"binance_archive","entry_time":"2026-09-09T16:11:53.346Z","entry_price":"84.775","exit_time":"2026-09-09T20:11:52.186Z","…":"shortened"}
```


### D086 — Evaluation shadow-trades-a3a.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/shadow_trades.py` (sha256 `36362974d16b`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/shadow-trades-a3a.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 372,925 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T12:45:07.137600+00:00` / `2026-10-13T12:45:07.137600+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T12:45:07.137600+00:00` / `2026-10-13T12:45:07.137600+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 372,925; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/shadow-trades-a3a.csv`; inspected file: `~/ralph-state/shadow-trades-a3a.csv`; rows: `1728`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S024](#schema-s024). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:6162","source_id":"sw-hype","version":"unknown-before-2026-09-13","variant":"delay=5s|timeout=4h|exit=TP1-only","tp_mode":"as_sent","price_path":"binance_archive","entry_time":"2026-09-09T16:11:53.346Z","entry_price":"84.775","exit_time":"2026-09-09T20:11:52.186Z","…":"shortened"}
```


### D087 — Evaluation shadow-trades-a3b.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/shadow_trades.py` (sha256 `36362974d16b`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/shadow-trades-a3b.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 1,789,532 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T22:51:53.725267+00:00` / `2026-10-13T22:51:53.725267+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T22:51:53.725267+00:00` / `2026-10-13T22:51:53.725267+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 1,789,532; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/shadow-trades-a3b.csv`; inspected file: `~/ralph-state/shadow-trades-a3b.csv`; rows: `7968`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S024](#schema-s024). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:5858","source_id":"sw-hype","version":"unknown-before-2026-09-13","variant":"delay=5s|timeout=4h|exit=TP1-only","tp_mode":"as_sent","price_path":"binance_archive","entry_time":"2026-09-03T17:56:47.214Z","entry_price":"84.09","exit_time":"2026-09-03T18:31:15.444Z","…":"shortened"}
```


### D088 — Evaluation shadow-trades-a3c.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/shadow_trades.py` (sha256 `36362974d16b`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/shadow-trades-a3c.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 1,790,254 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T06:57:59.797160+00:00` / `2026-10-14T06:57:59.797160+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T06:57:59.797160+00:00` / `2026-10-14T06:57:59.797160+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 1,790,254; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/shadow-trades-a3c.csv`; inspected file: `~/ralph-state/shadow-trades-a3c.csv`; rows: `7968`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S024](#schema-s024). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"sw-hype:5858","source_id":"sw-hype","version":"unknown-before-2026-09-13","variant":"delay=5s|timeout=4h|exit=TP1-only","tp_mode":"as_sent","price_path":"binance_archive","entry_time":"2026-09-03T17:56:47.214Z","entry_price":"84.09","exit_time":"2026-09-03T18:31:15.444Z","…":"shortened"}
```


### D089 — Evaluation short-candidates.jsonl

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task. pair_telegram_export.py names this file as an input only; it does not establish its producer.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/short-candidates.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 55,203 bytes**.
- First/last available file partition-or-mtime: `2026-10-13T21:06:46.066306+00:00` / `2026-10-13T21:06:46.066306+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-13T21:06:46.066306+00:00` / `2026-10-13T21:06:46.066306+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 55,203; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/short-candidates.jsonl`; inspected file: `~/ralph-state/short-candidates.jsonl`; rows: `84`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S025](#schema-s025). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"export_id":21134,"telegram_utc":"2026-09-03T17:56:41Z","telegram_local_exported":"2026-09-03T19:56:41","symbol":"HYPE","format":"old","price":84.06,"sl":84.81,"tp1":83.76,"tp2":83.42,"…":"shortened"}
```


### D090 — Evaluation short-watch-alert-texts.csv

Personal category only: **1 files; 4,082 bytes**.


### D091 — Evaluation short-watch-alerts.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/short-watch-alerts.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 17,291 bytes**.
- First/last available file partition-or-mtime: `2026-10-11T21:35:45.290469+00:00` / `2026-10-11T21:35:45.290469+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-11T21:35:45.290469+00:00` / `2026-10-11T21:35:45.290469+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 17,291; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/short-watch-alerts.csv`; inspected file: `~/ralph-state/short-watch-alerts.csv`; rows: `82`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S026](#schema-s026). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"utc_time":"2026-09-03T17:56:42.041Z","source_log":"zec-hype-short-watch.log","symbol":"HYPEUSDT","mark_at_alert":"84.06","sl":"","tp1":"83.76","tp2":"83.42","tp3":"82.75","telegram_message_id":"[omitted]","…":"shortened"}
```


### D092 — Evaluation v3-smoke.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/v3-smoke.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 2,971 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T08:09:31.132974+00:00` / `2026-10-14T08:09:31.132974+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T08:09:31.132974+00:00` / `2026-10-14T08:09:31.132974+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 2,971; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/v3-smoke.log`; inspected file: `~/ralph-state/v3-smoke.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D093 — Evaluation v4-report.txt

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/v4-report.txt`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 5,600 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T11:18:47.856316+00:00` / `2026-10-14T11:18:47.856316+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T11:18:47.856316+00:00` / `2026-10-14T11:18:47.856316+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 5,600; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/v4-report.txt`; inspected file: `~/ralph-state/v4-report.txt`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D094 — Evaluation v4-run.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/v4-run.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 11,405 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T11:15:52.616127+00:00` / `2026-10-14T11:15:52.616127+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T11:15:52.616127+00:00` / `2026-10-14T11:15:52.616127+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 11,405; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/v4-run.log`; inspected file: `~/ralph-state/v4-run.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D095 — Evaluation v5-run.log

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/v5-run.log`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 139 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T12:38:18.375688+00:00` / `2026-10-14T12:38:18.375688+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T12:38:18.375688+00:00` / `2026-10-14T12:38:18.375688+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 139; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/v5-run.log`; inspected file: `~/ralph-state/v5-run.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D096 — Evaluation v6-archive-sizes.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: not verified. No exact output-writing/redirection command found in inspected repository/workspace scripts, service definitions, user crontab or OpenClaw job prompts. Filename resemblance to an evaluator is not provenance; outcome/report contents were not opened for this task.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/v6-archive-sizes.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 12,161 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T06:37:00.811309+00:00` / `2026-10-17T06:37:00.811309+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T06:37:00.811309+00:00` / `2026-10-17T06:37:00.811309+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 12,161.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/v6-archive-sizes.csv`; inspected file: `~/ralph-state/v6-archive-sizes.csv`; rows: `300`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S027](#schema-s027). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"symbol":"BTCUSDT","day":"2026-08-01","source":"HEAD","status":"200","bytes":"5049749"}
```


### D097 — Evaluation velocity-alerts.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/export_velocity_alerts.py` (sha256 `05ac35e69770`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/velocity-alerts.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 48,330 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T07:44:26.342138+00:00` / `2026-10-14T07:44:26.342138+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T07:44:26.342138+00:00` / `2026-10-14T07:44:26.342138+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 48,330; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/velocity-alerts.csv`; inspected file: `~/ralph-state/velocity-alerts.csv`; rows: `293`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S028](#schema-s028). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"ETH-DOWN-1786374789722-rrlduq","event_time_utc":"2026-08-10T15:13:09.722Z","symbol":"ETH","source":"Binance live trade stream","trigger_label":"60s","direction":"DOWN","alert_price":"1877.89","trigger_move_pct":"-0.6512538355729524","threshold_pct":"0.65","…":"shortened"}
```


### D098 — Evaluation velocity-excursions-smoke.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/velocity_excursions.py` (sha256 `d527cf550f69`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/velocity-excursions-smoke.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 6,800 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T12:26:41.029828+00:00` / `2026-10-14T12:26:41.029828+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T12:26:41.029828+00:00` / `2026-10-14T12:26:41.029828+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 6,800; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/velocity-excursions-smoke.csv`; inspected file: `~/ralph-state/velocity-excursions-smoke.csv`; rows: `12`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S029](#schema-s029). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"BTC-UP-1789979897345-d6sz8b","symbol":"BTC","direction":"UP","plan_tradable":"n","t0":"2026-09-21T08:38:17.345Z","p0_time":"2026-09-21T08:38:17.349Z","p0":"83125.6","coverage_ok":"y","drift_10":"19.8855707508","…":"shortened"}
```


### D099 — Evaluation velocity-excursions-v5.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/velocity_excursions.py` (sha256 `d527cf550f69`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/velocity-excursions-v5.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 154,762 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T12:38:18.375688+00:00` / `2026-10-14T12:38:18.375688+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T12:38:18.375688+00:00` / `2026-10-14T12:38:18.375688+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 154,762; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/velocity-excursions-v5.csv`; inspected file: `~/ralph-state/velocity-excursions-v5.csv`; rows: `293`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S029](#schema-s029). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"BTC-UP-1787152019278-xupw3o","symbol":"BTC","direction":"UP","plan_tradable":"y","t0":"2026-08-19T15:06:59.278Z","p0_time":"2026-08-19T15:06:59.280Z","p0":"66420.5","coverage_ok":"y","drift_10":"4.27578834848","…":"shortened"}
```


### D100 — Evaluation velocity-trades-smoke.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/velocity_trades.py` (sha256 `0e1d6d0fc8f6`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/velocity-trades-smoke.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 88,551 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T08:09:31.132974+00:00` / `2026-10-14T08:09:31.132974+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T08:09:31.132974+00:00` / `2026-10-14T08:09:31.132974+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 88,551; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/velocity-trades-smoke.csv`; inspected file: `~/ralph-state/velocity-trades-smoke.csv`; rows: `432`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S030](#schema-s030). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"BTC-UP-1789979897345-d6sz8b","symbol":"BTC","direction":"UP","plan_tradable":"n","side":"fade","variant":"5s|30m","price_path":"binance_archive","entry_time":"2026-09-21T08:38:22.371Z","entry_price":"83230.8","…":"shortened"}
```


### D101 — Evaluation velocity-trades-v4.csv

- Purpose: Alert evaluation/replay outputs or run diagnostics.
- Producer: `tools/alert-eval/velocity_trades.py` (sha256 `0e1d6d0fc8f6`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Local alert ledger plus Binance/Bybit archives; file-specific source not verified where producer unknown.
- Location/naming: `~/ralph-state/velocity-trades-v4.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one alert/variant replay result or report; non-tabular logs have no verified row schema.
- Consumers: tools/alert-eval/*.py and operator reports.
- Known gaps/caps: Offline evaluation, not fills or real P&L. CLI parameters/costs/coverage vary across versions; do not combine versions silently.
- Observed size: **1 files; 2,160,843 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T11:15:52.604127+00:00` / `2026-10-14T11:15:52.604127+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T11:15:52.604127+00:00` / `2026-10-14T11:15:52.604127+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 2,160,843; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-state/velocity-trades-v4.csv`; inspected file: `~/ralph-state/velocity-trades-v4.csv`; rows: `10548`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S030](#schema-s030). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"alert_id":"ETH-DOWN-1786374789722-rrlduq","symbol":"ETH","direction":"DOWN","plan_tradable":"y","side":"fade","variant":"5s|30m","price_path":"binance_archive","entry_time":"2026-08-10T15:13:14.754Z","entry_price":"1877.45","…":"shortened"}
```


### D102 — Watcher alert-feedback.jsonl

Research data classification approved 2026-10-18. V6 preregistration applies: structural inspection only; no example row, field-value distribution, PnL, win rate or outcome aggregate. Historical/manual variants are included in the schema union without attributing them to the current watcher.

- Purpose: Append-only alert, review and paper/demo event research ledger.
- Producer: `tools/crypto-updates/realtime-market-watcher.mjs` → appendFeedback; current runtime/repo SHA-256 both `75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44`. Unit: crypto-updates-market-watcher.service. Legacy manual/backfill writer not verified.
- Source: public spot/Hyperliquid market events plus local simulated plans/reviews; collector futures context may be embedded. No personal account execution records were read.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/alert-feedback.jsonl`.
- Rotation/compression/retention: plain append-only JSONL, no rotation or deletion policy verified in producer code.
- Row definition: one appended lifecycle/event envelope; heterogeneous records, not one row per independent trade. Message status rows may lack market event time.
- Consumers: feedback/journal indexers, setup analysis and research tools; schema presence does not authorize interim evaluation.
- Known gaps/caps: optional nested variants, historical producer revisions not verified; live-feed coverage and independent-trade counts are not established by row count.
- Observed size: **1 file; 2,593,496 bytes** (2026-10-18 structural scan).
- First/last local record timestamp (recordedAt): `2026-08-09T23:34:00.000Z` / `2026-10-17T22:45:57.191Z`.
- First/last available file mtime: `2026-10-17T22:45:57.190122+00:00` / `2026-10-17T22:45:57.190122+00:00`; mtime is not creation time.
- Stored bytes/day: single mutable file; all retained bytes are attributed to the file mtime day, not daily historical ingress. Historical daily ingress not verified.
- Rows/hour: not applicable to a mutable heterogeneous research event ledger; not calculated.
- Newest eligible complete file: none (mutable). Inspected whole current file: `alert-feedback.jsonl`; rows: **995**; unchanged size/mtime during read: **True**.
- Clock semantics: recordedAt is local append time; eventTime/alertTime and fill/entry/exit/lastEventTime are market-event-derived epoch ms; submittedAt copies entryTime, not real order-send time. ISO companions encode the same clocks. timeExitAt/triggerTime are planned deadlines. generated/generatedIso are local collector snapshot time; ageMs/afterMs/validUntilMs are durations, not epochs. observedAt is event-derived for reviews, with local fallback on finalization.
- Event-time bounds by available field (timestamps only; absent historical fields are not inferred):
  - `alert.eventTime`: `2026-08-10T15:13:09.722000+00:00` / `2026-10-17T21:45:36.434000+00:00`.
  - `close.entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `close.exitTime`: `2026-09-24T09:35:28.886000+00:00` / `2026-10-16T17:41:38.764000+00:00`.
  - `close.trade.entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `close.trade.lastEventTime`: `2026-09-24T09:35:28.886000+00:00` / `2026-10-16T17:41:38.764000+00:00`.
  - `position.entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `position.lastEventTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `position.submittedAt`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `review.alertTime`: `2026-08-10T15:13:09.722000+00:00` / `2026-10-17T21:45:36.434000+00:00`.
  - `review.lastEventTime`: `2026-08-10T16:13:35.706000+00:00` / `2026-10-17T22:45:56.585000+00:00`.
  - `trade.entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `trade.lastEventTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.

Field semantics source: watcher append helpers; maybeOpenPaperTrade, closePaperTrade, maybeOpenDemoSimPosition, closeDemoSimPosition, paperPnl, startReview, updateReviewStats, finalizeReview, evidenceGate, readOrderflowContext and TA helpers. Collector passthrough fields: tools/collector/orderflow_engine.py. No source record values are shown.

| Field path | Observed types | Unit / clock | Meaning / source boundary |
|---|---|---|---|
| `alert` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.direction` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.eventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `alert.evidence` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.evidence.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.evidence.blockers[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.evidence.features` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.evidence.features.aggressiveBuyNotional` | integer / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.aggressiveSellNotional` | integer / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.bookAgeMs` | integer / null | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.evidence.features.bookFresh` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.evidence.features.bookImbalance` | null / number | percent | Bid minus ask depth divided by total depth; evidenceGate multiplies by 100, collector context does not. |
| `alert.evidence.features.cvdNotional` | integer / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.cvdPctOfVolume` | integer / null / number | not verified | Observed field/type only; exact producer unit/meaning not verified. |
| `alert.evidence.features.depthChangePct` | null / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.evidence.features.spreadPct` | null / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.evidence.features.top5DepthNotional` | integer / null / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.tradeFlowNotional` | integer / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.volumeRecentNotional` | null / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.evidence.features.volumeVelocityRatio` | null / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.evidence.features.windowMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.evidence.maxScore` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.evidence.pass` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.evidence.reasons` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.evidence.reasons[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.evidence.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.fadePlan` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.fadePlan.entryBandLimit` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.fadePlan.entryBandPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.fadePlan.fadeDirection` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.fadePlan.leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.fadePlan.lines` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.fadePlan.lines[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.fadePlan.marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `alert.fadePlan.noChasePrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.fadePlan.notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.fadePlan.stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.fadePlan.stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.fadePlan.stopLossUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `alert.fadePlan.takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.fadePlan.takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.fadePlan.takeProfitUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `alert.fadePlan.tradable` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.fadePlan.worstFillPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `alert.orderflowContext` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.orderflowContext.ageMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.orderflowContext.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.available` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.orderflowContext.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.orderflowContext.enabled` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.orderflowContext.features` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.orderflowContext.features.barBought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.barClose` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.barDelta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.barHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.barLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.barOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.barSold` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.barVelMax` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.orderflowContext.features.barVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.bookAskDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.bookBestAsk` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.bookBestBid` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.bookBidDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.bookImbalance` | number | ratio [-1,1] | Bid minus ask depth divided by total depth; evidenceGate multiplies by 100, collector context does not. |
| `alert.orderflowContext.features.indexPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.lastPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.liquidationCount5m` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.orderflowContext.features.liquidationLong5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.orderflowContext.features.liquidationShort5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.orderflowContext.features.markPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.oi` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.sessionCvd` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.sessionHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionPoc` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionVah` | integer | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionVal` | integer | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.sessionVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.features.sessionVwap` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.features.velocity` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.orderflowContext.generated` | integer | epoch ms; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.orderflowContext.generatedIso` | string | ISO 8601 UTC; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.orderflowContext.maxAgeMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.orderflowContext.path` | string | path text; deliberately not displayed | Collector feature-source path; only schema retained. |
| `alert.orderflowContext.recentEvents` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.orderflowContext.recentEvents[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.orderflowContext.recentEvents[].avg_price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.recentEvents[].bought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.recentEvents[].delta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.recentEvents[].from` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.recentEvents[].levels` | integer | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.orderflowContext.recentEvents[].liquidated` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.recentEvents[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.recentEvents[].qty` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.recentEvents[].ratio` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.orderflowContext.recentEvents[].side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.recentEvents[].sold` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.recentEvents[].t` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `alert.orderflowContext.recentEvents[].time` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `alert.orderflowContext.recentEvents[].to` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.orderflowContext.recentEvents[].trades` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.orderflowContext.recentEvents[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.recentEvents[].volume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.orderflowContext.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.stale` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.orderflowContext.symbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.orderflowContext.timeframeSeconds` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.sendResult` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.sendResult.code` | integer | process exit code | Message subprocess close status, not event time. |
| `alert.sendResult.stderr` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `alert.sendResult.stdout` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `alert.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.available` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.blockers[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.breakout` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.breakout.level` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.breakout.supports` | null / string | not verified | Observed field/type only; exact producer unit/meaning not verified. |
| `alert.ta.breakout.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.btcGate` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.btcGate.enforced` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.btcGate.nearProfileEdge` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.btcGate.negative` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.btcGate.negative[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.btcGate.pass` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.btcGate.positive` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.btcGate.positive[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.btcGate.reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.btcGate.regime` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.btcGate.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.ta.btcGate.wouldBlock` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.confluenceLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.context` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.context.dailyVwap` | null / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.profile` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.context.profile.poc` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.profile.vah` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.profile.val` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.rsi` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.context.rsi.15m` | number | RSI points [0,100] | Watcher rsi() for the named closed-candle timeframe. |
| `alert.ta.context.rsi.1h` | number | RSI points [0,100] | Watcher rsi() for the named closed-candle timeframe. |
| `alert.ta.context.rsi.4h` | number | RSI points [0,100] | Watcher rsi() for the named closed-candle timeframe. |
| `alert.ta.context.rsi.5m` | number | RSI points [0,100] | Watcher rsi() for the named closed-candle timeframe. |
| `alert.ta.context.trendline` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.context.trendline.dynamicResistance` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.trendline.dynamicSupport` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.context.trendline.nearResistance` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.context.trendline.nearSupport` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.context.trendline.resistanceDistancePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.context.trendline.supportDistancePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.context.trendline.trend` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.context.weeklyVwap` | null / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.deliveryClass` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.entryTriggerHorizon` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.fib` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.fib.distancePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.fib.name` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.fib.price` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.holdingHorizon` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.htfBias` | null / string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.invalidation` | string | descriptive text | invalidationForTradeDirection formats the invalidation rule/level as text, not a numeric price. |
| `alert.ta.levels` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.levels[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.levels[].name` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.levels[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.nearestLevel` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.nearestLevel.distancePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.nearestLevel.name` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.nearestLevel.price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.nearestLevels` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.nearestLevels[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.nearestLevels[].distancePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.nearestLevels[].name` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.nearestLevels[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.orderflowContext.ageMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.ta.orderflowContext.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.available` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.orderflowContext.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.orderflowContext.enabled` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.orderflowContext.features` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.orderflowContext.features.barBought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.barClose` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.barDelta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.barHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.barLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.barOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.barSold` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.barVelMax` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.orderflowContext.features.barVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.bookAskDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.bookBestAsk` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.bookBestBid` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.bookBidDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.bookImbalance` | number | ratio [-1,1] | Bid minus ask depth divided by total depth; evidenceGate multiplies by 100, collector context does not. |
| `alert.ta.orderflowContext.features.indexPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.lastPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.liquidationCount5m` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.ta.orderflowContext.features.liquidationLong5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.ta.orderflowContext.features.liquidationShort5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.ta.orderflowContext.features.markPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.oi` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.sessionCvd` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.sessionHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionPoc` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionVah` | integer | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionVal` | integer | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.sessionVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.features.sessionVwap` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.features.velocity` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.orderflowContext.generated` | integer | epoch ms; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.ta.orderflowContext.generatedIso` | string | ISO 8601 UTC; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.ta.orderflowContext.maxAgeMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.ta.orderflowContext.path` | string | path text; deliberately not displayed | Collector feature-source path; only schema retained. |
| `alert.ta.orderflowContext.recentEvents` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.orderflowContext.recentEvents[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.orderflowContext.recentEvents[].avg_price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.recentEvents[].bought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.recentEvents[].delta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.recentEvents[].from` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.recentEvents[].levels` | integer | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.orderflowContext.recentEvents[].liquidated` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.recentEvents[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.recentEvents[].qty` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.recentEvents[].ratio` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.orderflowContext.recentEvents[].side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.recentEvents[].sold` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.recentEvents[].t` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `alert.ta.orderflowContext.recentEvents[].time` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `alert.ta.orderflowContext.recentEvents[].to` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.orderflowContext.recentEvents[].trades` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.ta.orderflowContext.recentEvents[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.recentEvents[].volume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.orderflowContext.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.stale` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.orderflowContext.symbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.orderflowContext.timeframeSeconds` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.ta.reasons` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.reasons[]` | string | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.ta.sfp` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.sfp.level` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.sfp.supports` | string | not verified | Observed field/type only; exact producer unit/meaning not verified. |
| `alert.ta.sfp.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.targetOrderflowContext.ageMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.ta.targetOrderflowContext.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.available` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.targetOrderflowContext.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.enabled` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.targetOrderflowContext.features` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.targetOrderflowContext.features.barBought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.barClose` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.barDelta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.barHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.barLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.barOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.barSold` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.barVelMax` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.targetOrderflowContext.features.barVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.bookAskDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.bookBestAsk` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.bookBestBid` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.bookBidDepth` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.bookImbalance` | number | ratio [-1,1] | Bid minus ask depth divided by total depth; evidenceGate multiplies by 100, collector context does not. |
| `alert.ta.targetOrderflowContext.features.indexPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.liquidationCount5m` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.ta.targetOrderflowContext.features.liquidationLong5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.ta.targetOrderflowContext.features.liquidationShort5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.ta.targetOrderflowContext.features.markPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.oi` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.sessionCvd` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.sessionHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionPoc` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionVah` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionVal` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.sessionVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.features.sessionVwap` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.features.velocity` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.targetOrderflowContext.generated` | integer | epoch ms; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.ta.targetOrderflowContext.generatedIso` | string | ISO 8601 UTC; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.ta.targetOrderflowContext.maxAgeMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.ta.targetOrderflowContext.path` | string | path text; deliberately not displayed | Collector feature-source path; only schema retained. |
| `alert.ta.targetOrderflowContext.recentEvents` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.targetOrderflowContext.recentEvents[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.targetOrderflowContext.recentEvents[].avg_price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.recentEvents[].from` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.recentEvents[].levels` | integer | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.targetOrderflowContext.recentEvents[].liquidated` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.recentEvents[].move_pct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.ta.targetOrderflowContext.recentEvents[].notional_5s` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.ta.targetOrderflowContext.recentEvents[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.recentEvents[].qty` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.ta.targetOrderflowContext.recentEvents[].ratio` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.ta.targetOrderflowContext.recentEvents[].side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.recentEvents[].t` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `alert.ta.targetOrderflowContext.recentEvents[].time` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `alert.ta.targetOrderflowContext.recentEvents[].to` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.ta.targetOrderflowContext.recentEvents[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.recentEvents[].window_s` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.ta.targetOrderflowContext.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.stale` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.targetOrderflowContext.symbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.targetOrderflowContext.timeframeSeconds` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.ta.tradeAllowed` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.ta.tradeClass` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.ta.tradeClass.holdingHorizon` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.tradeClass.key` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.tradeClass.label` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.tradeClass.reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.tradeDirection` | null / string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.ta.tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.targetOrderflowContext.ageMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.targetOrderflowContext.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.available` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.targetOrderflowContext.blockers` | array | text/list of text | Generated evidence, blocker or presentation labels; values intentionally omitted. |
| `alert.targetOrderflowContext.enabled` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.targetOrderflowContext.features` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.targetOrderflowContext.features.barBought` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.barClose` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.barDelta` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.barHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.barLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.barOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.barSold` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.barVelMax` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.targetOrderflowContext.features.barVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.bookAskDepth` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.bookBestAsk` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.bookBestBid` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.bookBidDepth` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.bookImbalance` | number | ratio [-1,1] | Bid minus ask depth divided by total depth; evidenceGate multiplies by 100, collector context does not. |
| `alert.targetOrderflowContext.features.indexPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.liquidationCount5m` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `alert.targetOrderflowContext.features.liquidationLong5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.targetOrderflowContext.features.liquidationShort5m` | integer / number | base-asset units | Collector rolling five-minute forced-order quantity by liquidated side. |
| `alert.targetOrderflowContext.features.markPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.oi` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.sessionCvd` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.sessionHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionOpen` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionPoc` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionVah` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionVal` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.sessionVolume` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.features.sessionVwap` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.features.velocity` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.targetOrderflowContext.generated` | integer | epoch ms; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.targetOrderflowContext.generatedIso` | string | ISO 8601 UTC; local | Collector snapshot generation wall clock; readOrderflowContext propagates it. |
| `alert.targetOrderflowContext.maxAgeMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `alert.targetOrderflowContext.path` | string | path text; deliberately not displayed | Collector feature-source path; only schema retained. |
| `alert.targetOrderflowContext.recentEvents` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.targetOrderflowContext.recentEvents[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.targetOrderflowContext.recentEvents[].avg_price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.recentEvents[].from` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.recentEvents[].levels` | integer | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `alert.targetOrderflowContext.recentEvents[].liquidated` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.recentEvents[].move_pct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.targetOrderflowContext.recentEvents[].notional_5s` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.targetOrderflowContext.recentEvents[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.recentEvents[].qty` | integer / number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `alert.targetOrderflowContext.recentEvents[].ratio` | integer / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.targetOrderflowContext.recentEvents[].side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.recentEvents[].t` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `alert.targetOrderflowContext.recentEvents[].time` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `alert.targetOrderflowContext.recentEvents[].to` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `alert.targetOrderflowContext.recentEvents[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.recentEvents[].window_s` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.targetOrderflowContext.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.stale` | boolean | boolean | Named gate/availability/support/state flag produced by watcher logic. |
| `alert.targetOrderflowContext.symbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.targetOrderflowContext.timeframeSeconds` | integer | seconds; duration | Collector bar/event window duration. |
| `alert.thresholdPct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.triggerKind` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.triggerLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `alert.triggerMovePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `alert.volumeRecentNotional` | null / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `alert.volumeVelocityRatio` | null / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `alert.windowMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `classification` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `classification.reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `classification.verdict` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `close.alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `close.equityAfterUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.exitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.exitTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.exitTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `close.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.mode` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.orderId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.paperTradeId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.pnl` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `close.pnl.directionalMovePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `close.pnl.feesUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.pnl.grossPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.pnl.netPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.pnl.rMultiple` | number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `close.protectiveOrders` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `close.protectiveOrders[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `close.protectiveOrders[].id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.protectiveOrders[].status` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.protectiveOrders[].triggerPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.protectiveOrders[].triggerTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.protectiveOrders[].triggerTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `close.protectiveOrders[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `close.trade.alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.trade.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.trade.entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.trade.entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `close.trade.htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `close.trade.lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.trade.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.trade.leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `close.trade.marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.trade.maxAdversePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `close.trade.maxFavorablePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `close.trade.notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `close.trade.quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `close.trade.riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `close.trade.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `close.trade.side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `close.trade.stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.trade.strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `close.trade.takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `close.trade.timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `close.trade.timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `close.trade.tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.trade.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `close.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `position.alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `position.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `position.entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `position.entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `position.fillStatus` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `position.lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `position.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `position.leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `position.marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `position.maxAdversePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `position.maxFavorablePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `position.mode` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `position.orderId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `position.paperTradeId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `position.protectiveOrders` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `position.protectiveOrders[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `position.protectiveOrders[].id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `position.protectiveOrders[].status` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.protectiveOrders[].triggerPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `position.protectiveOrders[].triggerTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `position.protectiveOrders[].triggerTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `position.protectiveOrders[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `position.riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `position.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `position.side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `position.stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `position.strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.submittedAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `position.submittedAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `position.takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `position.takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `position.timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `position.timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `position.tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `position.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `recordedAt` | string | ISO 8601 UTC; local | Append-time wall clock from nowIso() in appendFeedback/appendPaperTrade/appendDemoSim. |
| `review` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.alertPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.alertTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `review.alertTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `review.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.checkpoints` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.checkpoints[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.checkpoints[].afterMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `review.checkpoints[].directionalMovePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `review.checkpoints[].label` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.checkpoints[].movePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `review.checkpoints[].observedAt` | string | ISO 8601 UTC; event-derived | Review checkpoint/entry mark from market eventTime; finalizeReview may fall back to local nowIso() when no last event exists. |
| `review.checkpoints[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.direction` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch` | null / object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.entryResearch.fadeDirection` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.live2m` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.entryResearch.live2m.firstInRangeAt` | null / string | ISO 8601 UTC; event-derived | Review checkpoint/entry mark from market eventTime; finalizeReview may fall back to local nowIso() when no last event exists. |
| `review.entryResearch.live2m.firstInRangePrice` | integer / null / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.entryResearch.live2m.label` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.live2m.maxPrice` | integer / null / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.entryResearch.live2m.minPrice` | integer / null / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.entryResearch.live2m.status` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.live2m.validUntilMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `review.entryResearch.marks` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.entryResearch.marks[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `review.entryResearch.marks[].afterMs` | integer | milliseconds; duration | Window, offset, freshness age or validity duration; not an epoch timestamp. |
| `review.entryResearch.marks[].key` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.marks[].label` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.marks[].observedAt` | string | ISO 8601 UTC; event-derived | Review checkpoint/entry mark from market eventTime; finalizeReview may fall back to local nowIso() when no last event exists. |
| `review.entryResearch.marks[].price` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.entryResearch.marks[].status` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.entryResearch.rangeHigh` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.entryResearch.rangeLow` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `review.lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `review.lastPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.maxAdversePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `review.maxFavorablePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `review.maxHigh` | number | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `review.maxPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.method` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `review.minLow` | number | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `review.minPrice` | integer / number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `review.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.triggerKind` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.triggerLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `review.triggerMovePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `review.volumeRecentNotional` | null / number | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `review.volumeVelocityRatio` | null / number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `sendResult` | null | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `sourceAlert` | object | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.alertPrice` | integer | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.alertTimeIso` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.assetLabel` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.assetSymbol` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.direction` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.source` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.telegramMessageId` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.triggerKind` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.triggerLabel` | string | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.triggerMovePct` | number | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.volumeRecentNotional` | integer | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `sourceAlert.volumeVelocityRatio` | number | legacy schema | Historical/manual-review variant; exact writer/units not verified in current producer (consumer compatibility exists in index-monitor-feedback). |
| `trade` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `trade.alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `trade.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `trade.htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `trade.lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `trade.marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `trade.maxAdversePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.maxFavorablePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `trade.quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `trade.riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `trade.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `trade.side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `trade.tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |


### D103 — Watcher bybit-execution-reactor-state.json

Personal category only: **1 files; 12,988 bytes**.


### D104 — Watcher bybit-execution-reactor.log

Personal category only: **1 files; 38,601,611 bytes**.


### D105 — Watcher bybit-execution-reactor.pid

Personal category only: **1 files; 7 bytes**.


### D106 — Watcher demo-sim-trades.jsonl

Research data classification approved 2026-10-18. V6 preregistration applies: structural inspection only; no example row, field-value distribution, PnL, win rate or outcome aggregate. Historical/manual variants are included in the schema union without attributing them to the current watcher.

- Purpose: Local demo-sim order/position lifecycle research ledger; not exchange execution.
- Producer: `tools/crypto-updates/realtime-market-watcher.mjs` → appendDemoSim; current runtime/repo SHA-256 both `75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44`. Unit: crypto-updates-market-watcher.service. Legacy manual/backfill writer not verified.
- Source: public spot/Hyperliquid market events plus local simulated plans/reviews; collector futures context may be embedded. No personal account execution records were read.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl`.
- Rotation/compression/retention: plain append-only JSONL, no rotation or deletion policy verified in producer code.
- Row definition: one appended lifecycle/event envelope; heterogeneous records, not one row per independent trade. Message status rows may lack market event time.
- Consumers: feedback/journal indexers, setup analysis and research tools; schema presence does not authorize interim evaluation.
- Known gaps/caps: optional nested variants, historical producer revisions not verified; live-feed coverage and independent-trade counts are not established by row count.
- Observed size: **1 file; 34,156 bytes** (2026-10-18 structural scan).
- First/last local record timestamp (recordedAt): `2026-09-24T09:35:25.886Z` / `2026-10-16T17:42:12.700Z`.
- First/last available file mtime: `2026-10-16T17:42:12.698992+00:00` / `2026-10-16T17:42:12.698992+00:00`; mtime is not creation time.
- Stored bytes/day: single mutable file; all retained bytes are attributed to the file mtime day, not daily historical ingress. Historical daily ingress not verified.
- Rows/hour: not applicable to a mutable heterogeneous research event ledger; not calculated.
- Newest eligible complete file: none (mutable). Inspected whole current file: `demo-sim-trades.jsonl`; rows: **44**; unchanged size/mtime during read: **True**.
- Clock semantics: recordedAt is local append time; eventTime/alertTime and fill/entry/exit/lastEventTime are market-event-derived epoch ms; submittedAt copies entryTime, not real order-send time. ISO companions encode the same clocks. timeExitAt/triggerTime are planned deadlines. generated/generatedIso are local collector snapshot time; ageMs/afterMs/validUntilMs are durations, not epochs. observedAt is event-derived for reviews, with local fallback on finalization.
- Event-time bounds by available field (timestamps only; absent historical fields are not inferred):
  - `entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `exitTime`: `2026-09-24T09:35:28.886000+00:00` / `2026-10-16T17:41:38.764000+00:00`.
  - `lastEventTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `submittedAt`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.

Field semantics source: watcher append helpers; maybeOpenPaperTrade, closePaperTrade, maybeOpenDemoSimPosition, closeDemoSimPosition, paperPnl, startReview, updateReviewStats, finalizeReview, evidenceGate, readOrderflowContext and TA helpers. Collector passthrough fields: tools/collector/orderflow_engine.py. No source record values are shown.

| Field path | Observed types | Unit / clock | Meaning / source boundary |
|---|---|---|---|
| `alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `equityAfterUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `exitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `exitTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `exitTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `fillStatus` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `maxAdversePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `maxFavorablePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `mode` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `orderId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `orderType` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `paperTradeId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `pnl` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `pnl.directionalMovePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `pnl.feesUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.grossPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.netPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.rMultiple` | number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `protectiveOrders` | array | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `protectiveOrders[]` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `protectiveOrders[].id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `protectiveOrders[].status` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `protectiveOrders[].triggerPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `protectiveOrders[].triggerTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `protectiveOrders[].triggerTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `protectiveOrders[].type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `recordedAt` | string | ISO 8601 UTC; local | Append-time wall clock from nowIso() in appendFeedback/appendPaperTrade/appendDemoSim. |
| `riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `sendResult` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `sendResult.code` | integer | process exit code | Message subprocess close status, not event time. |
| `sendResult.stderr` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `sendResult.stdout` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `submittedAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `submittedAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |


### D107 — Watcher execution-feedback.jsonl

Personal category only: **1 files; 45,303 bytes**.


### D108 — Watcher monitor-index.sqlite

Personal category only: **1 files; 3,481,600 bytes**.


### D109 — Watcher paper-trades.jsonl

Research data classification approved 2026-10-18. V6 preregistration applies: structural inspection only; no example row, field-value distribution, PnL, win rate or outcome aggregate. Historical/manual variants are included in the schema union without attributing them to the current watcher.

- Purpose: Local paper-trade lifecycle research ledger; not exchange execution.
- Producer: `tools/crypto-updates/realtime-market-watcher.mjs` → appendPaperTrade; current runtime/repo SHA-256 both `75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44`. Unit: crypto-updates-market-watcher.service. Legacy manual/backfill writer not verified.
- Source: public spot/Hyperliquid market events plus local simulated plans/reviews; collector futures context may be embedded. No personal account execution records were read.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl`.
- Rotation/compression/retention: plain append-only JSONL, no rotation or deletion policy verified in producer code.
- Row definition: one appended lifecycle/event envelope; heterogeneous records, not one row per independent trade. Message status rows may lack market event time.
- Consumers: feedback/journal indexers, setup analysis and research tools; schema presence does not authorize interim evaluation.
- Known gaps/caps: optional nested variants, historical producer revisions not verified; live-feed coverage and independent-trade counts are not established by row count.
- Observed size: **1 file; 24,261 bytes** (2026-10-18 structural scan).
- First/last local record timestamp (recordedAt): `2026-09-24T09:35:25.877Z` / `2026-10-16T17:42:17.693Z`.
- First/last available file mtime: `2026-10-16T17:42:17.691970+00:00` / `2026-10-16T17:42:17.691970+00:00`; mtime is not creation time.
- Stored bytes/day: single mutable file; all retained bytes are attributed to the file mtime day, not daily historical ingress. Historical daily ingress not verified.
- Rows/hour: not applicable to a mutable heterogeneous research event ledger; not calculated.
- Newest eligible complete file: none (mutable). Inspected whole current file: `paper-trades.jsonl`; rows: **35**; unchanged size/mtime during read: **True**.
- Clock semantics: recordedAt is local append time; eventTime/alertTime and fill/entry/exit/lastEventTime are market-event-derived epoch ms; submittedAt copies entryTime, not real order-send time. ISO companions encode the same clocks. timeExitAt/triggerTime are planned deadlines. generated/generatedIso are local collector snapshot time; ageMs/afterMs/validUntilMs are durations, not epochs. observedAt is event-derived for reviews, with local fallback on finalization.
- Event-time bounds by available field (timestamps only; absent historical fields are not inferred):
  - `entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `exitTime`: `2026-09-24T09:35:28.886000+00:00` / `2026-10-16T17:41:38.764000+00:00`.
  - `fillTime`: `2026-10-02T17:24:56.820000+00:00` / `2026-10-02T17:24:56.820000+00:00`.
  - `lastEventTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `trade.entryTime`: `2026-09-24T09:34:58.838000+00:00` / `2026-10-16T17:34:03.496000+00:00`.
  - `trade.lastEventTime`: `2026-09-24T09:35:28.886000+00:00` / `2026-10-16T17:41:38.764000+00:00`.

Field semantics source: watcher append helpers; maybeOpenPaperTrade, closePaperTrade, maybeOpenDemoSimPosition, closeDemoSimPosition, paperPnl, startReview, updateReviewStats, finalizeReview, evidenceGate, readOrderflowContext and TA helpers. Collector passthrough fields: tools/collector/orderflow_engine.py. No source record values are shown.

| Field path | Observed types | Unit / clock | Meaning / source boundary |
|---|---|---|---|
| `alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `exitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `exitTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `exitTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `fillPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `fillTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `fillTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `maxAdversePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `maxFavorablePct` | integer | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `maxOpenTrades` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `pnl` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `pnl.directionalMovePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `pnl.feesUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.grossPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.netPnlUsd` | number | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `pnl.rMultiple` | number | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `reason` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `recordedAt` | string | ISO 8601 UTC; local | Append-time wall clock from nowIso() in appendFeedback/appendPaperTrade/appendDemoSim. |
| `riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `sendResult` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `sendResult.code` | integer | process exit code | Message subprocess close status, not event time. |
| `sendResult.stderr` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `sendResult.stdout` | string | text; deliberately not displayed | Message subprocess output/error; may contain delivery metadata. No content inspected or reproduced. |
| `side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `trade` | object | structural container | Nested variant payload; child field paths below define observed types. Optional/absent fields are not zero. |
| `trade.alertId` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `trade.assetLabel` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.assetSymbol` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.entryPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.entryTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.entryTimeIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `trade.htfBias` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.id` | string | identifier | Record/link/order/message identifier; values intentionally omitted. |
| `trade.lastEventTime` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.lastPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.leverage` | integer | dimensionless ratio | Named velocity/baseline ratio, leverage multiplier, or netPnlUsd/riskUsd (rMultiple); no aggregate calculated. |
| `trade.marginUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `trade.maxAdversePct` | integer / number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.maxFavorablePct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.notional` | integer | quote-currency notional | Price×quantity or signed/aggressor sum over the named window; not a trade count. |
| `trade.quantity` | number | base-asset units | Quantity, OI or signed bought/sold delta; collector-context fields preserve orderflow_engine units. |
| `trade.riskUsd` | integer | USD/USDT simulated accounting | Named margin/risk/target/equity/cost amount. paperPnl: gross=notional×directionalMovePct/100; fees=two-sided notional fee; net=gross−fees; equityAfter=margin+net. |
| `trade.score` | integer | count/score | Gate score, maximum allowed count or event/trade count as named; not a timestamp. |
| `trade.side` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.source` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.stopLossPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.stopLossPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.strategy` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.takeProfitPct` | number | percent (100 × fractional move) | Direction-adjusted or raw price/volume change, distance or plan percentage as named; field-level semantics only, no outcome values inspected. |
| `trade.takeProfitPrice` | number | quote currency / base unit | Price or price level in asset market units; copied/calculated by watcher TA, plan, paper/demo or collector context functions. |
| `trade.timeExitAt` | integer | epoch ms; event-derived | Market event/fill/exit time; triggerTime/timeExitAt are scheduled event-time deadlines, not observed fills. Source feed may fall back to local clock. |
| `trade.timeExitAtIso` | string | ISO 8601 UTC; event-derived | Formatted companion of event/fill/deadline time; collector recentEvents.time formats t. |
| `trade.tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `trade.type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `tradeTimeframe` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |
| `type` | string | categorical/text | Named event, asset, direction, strategy or descriptive state label; values intentionally omitted. |


### D110 — Watcher realtime-market-watcher.log

- Purpose: Watcher derived cache/health/runtime state.
- Producer: `tools/crypto-updates/realtime-market-watcher.mjs` (sha256 `75787e84c0c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot BTC/ETH/SOL, Hyperliquid HYPE; local collector enrichment; private reactor sources excluded.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.log`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest state/cache object or operational log line; personal records excluded.
- Consumers: watcher, setup-analysis, feedback/journal indexers; operator.
- Known gaps/caps: Mutable overwrite/append; no archival completeness guarantee. Cache maps use provider:symbol:startMs:endMs keys; timestamps are not all receive times.
- Observed size: **1 files; 1,527,026 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T14:02:00.911371+00:00` / `2026-10-17T14:02:00.911371+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T14:02:00.911371+00:00` / `2026-10-17T14:02:00.911371+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,527,026.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.log`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D111 — Watcher realtime-market-watcher.pid

- Purpose: Watcher derived cache/health/runtime state.
- Producer: `tools/crypto-updates/realtime-market-watcher.mjs` (sha256 `75787e84c0c9`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot BTC/ETH/SOL, Hyperliquid HYPE; local collector enrichment; private reactor sources excluded.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.pid`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest state/cache object or operational log line; personal records excluded.
- Consumers: watcher, setup-analysis, feedback/journal indexers; operator.
- Known gaps/caps: Mutable overwrite/append; no archival completeness guarantee. Cache maps use provider:symbol:startMs:endMs keys; timestamps are not all receive times.
- Observed size: **1 files; 8 bytes**.
- First/last available file partition-or-mtime: `2026-10-15T22:39:58.635265+00:00` / `2026-10-15T22:39:58.635265+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-15T22:39:58.635265+00:00` / `2026-10-15T22:39:58.635265+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 8; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.pid`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D112 — Watcher service-health-report.json

- Purpose: Watcher derived cache/health/runtime state.
- Producer: `tools/crypto-updates/service-health-check.mjs` (sha256 `440bdfb6c9ce`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot BTC/ETH/SOL, Hyperliquid HYPE; local collector enrichment; private reactor sources excluded.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/service-health-report.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest state/cache object or operational log line; personal records excluded.
- Consumers: watcher, setup-analysis, feedback/journal indexers; operator.
- Known gaps/caps: Mutable overwrite/append; no archival completeness guarantee. Cache maps use provider:symbol:startMs:endMs keys; timestamps are not all receive times.
- Observed size: **1 files; 5,050 bytes**.
- First/last available file partition-or-mtime: `2026-10-11T16:01:46.786432+00:00` / `2026-10-11T16:01:46.786432+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-11T16:01:46.786432+00:00` / `2026-10-11T16:01:46.786432+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 5,050; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/service-health-report.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S031](#schema-s031). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generatedAt":"2026-10-11T16:01:44.806Z","status":"service-health","since":"24 hours ago","services":[{"name":"crypto-updates-market-watcher.service","activeState":"active","subState":"running","nRestarts":0,"memoryCurrentBytes":184389632,"mainPid":3590354,"startedAt":"Fri 2026-10-09 06:40:29 UTC","commandOk":true,"stderr":null},{"name":"bybit-execution-reactor.service","activeState":"active","subState":"running","nRestarts":1,"memoryCurrentBytes":44019712,"mainPid":1627849,"startedAt":"Sat 2026-08-29 09:09:51 UTC","commandOk":true,"stderr":null},"…"],"orderflowContexts":"[omitted]","oomKills":[],"duplicateAlerts":[],"decision":{"notifyTomas":true,"reasons":["BTC collector gaps=3","ETH collector gaps=3","…"]}}
```


### D113 — Watcher setup-analysis.json

- Purpose: Watcher derived cache/health/runtime state.
- Producer: `~/.openclaw/workspace/crypto-updates/analyze-alert-setups.mjs` (sha256 `c1d33ff6a1a5`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot BTC/ETH/SOL, Hyperliquid HYPE; local collector enrichment; private reactor sources excluded.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/setup-analysis.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest state/cache object or operational log line; personal records excluded.
- Consumers: watcher, setup-analysis, feedback/journal indexers; operator.
- Known gaps/caps: Mutable overwrite/append; no archival completeness guarantee. Cache maps use provider:symbol:startMs:endMs keys; timestamps are not all receive times.
- Observed size: **1 files; 830,341 bytes**.
- First/last available file partition-or-mtime: `2026-08-29T16:31:04.042984+00:00` / `2026-08-29T16:31:04.042984+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-29T16:31:04.042984+00:00` / `2026-08-29T16:31:04.042984+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/setup-analysis.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S032](#schema-s032). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"version":1,"generated_at":"2026-08-29T16:31:04.037Z","source":"runtime/alert-feedback.jsonl","scope":"research_only_no_execution_or_sizing_changes","schema_fields":["setup_type","context","…"],"summary":{"reviewed_setups":240,"unreviewed_alerts":5,"total_alert_decisions":245,"candle_context_ready":"[omitted]","by_verdict":{"fade":106,"follow":113,"noisy":19,"unclassified":2},"by_setup_type":{"velocity-shock-15m":30,"velocity-shock-5m":74,"velocity-shock-60s":53,"wick-shock":83},"by_trigger_quality":{"evidence-high":80,"evidence-low":121,"evidence-medium":34,"evidence-unscored":5},"by_asset":{"BTC":30,"ETH":57,"HYPE":92,"SOL":61},"by_trend_context":"[omitted]","…":"shortened"},"call_line_decision":{"status":"research_candidate_not_live","live_alert_text_change":"[omitted]","reason":"A narrow bucket is consistent enough to record a low-sample Call candidate, but live alert text remains u … [shortened]
```


### D114 — Watcher setup-candle-context-cache.json

- Purpose: Watcher derived cache/health/runtime state.
- Producer: `~/.openclaw/workspace/crypto-updates/analyze-alert-setups.mjs` (sha256 `c1d33ff6a1a5`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot BTC/ETH/SOL, Hyperliquid HYPE; local collector enrichment; private reactor sources excluded.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/setup-candle-context-cache.json`.
- Rotation/compression/retention: `mutable`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one latest state/cache object or operational log line; personal records excluded.
- Consumers: watcher, setup-analysis, feedback/journal indexers; operator.
- Known gaps/caps: Mutable overwrite/append; no archival completeness guarantee. Cache maps use provider:symbol:startMs:endMs keys; timestamps are not all receive times.
- Observed size: **1 files; 10,721,795 bytes**.
- First/last available file partition-or-mtime: `2026-08-29T16:31:04.133984+00:00` / `2026-08-29T16:31:04.133984+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-29T16:31:04.133984+00:00` / `2026-08-29T16:31:04.133984+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `None`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/setup-candle-context-cache.json`; rows: `1`; read stability: `True`; status: mutable snapshot, not complete.
- Every observed field/type: [Schema S033](#schema-s033). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"binance_spot:ETHUSDT:1786353180000:1786378440000":{"venue":"binance_spot","symbol":"ETHUSDT","coin":null,"startMs":1786353180000,"endMs":1786378440000,"fetchedAt":"2026-08-18T19:56:04.277Z","candles":[{"time":"…","open":"…","high":"…","low":"…","close":"…","volume":"…"},{"time":"…","open":"…","high":"…","low":"…","close":"…","volume":"…"},"…"]},"hyperliquid:HYPE:1786360200000:1786385460000":{"venue":"hyperliquid","symbol":null,"coin":"HYPE","startMs":1786360200000,"endMs":1786385460000,"fetchedAt":"2026-08-18T19:56:04.540Z","candles":[],"error":"no_candles_returned"},"hyperliquid:HYPE:1786389840000:1786415100000":{"venue":"hyperliquid","symbol":null,"coin":"HYPE","startMs":1786389840000,"endMs":1786415100000,"fetchedAt":"2026-08-18T19:56:04.798Z","candles":[],"error":"no_candles_returned"},"hyperliquid:HYPE:1786389900000:1786415160000":{"venue":"hyperliquid","symbol":null,"coin":"HYPE" … [shortened]
```


### D115 — Watcher trade-research-journal.json

Personal category only: **1 files; 3,777,104 bytes**.


### D116 — Orderflow spike raw

- Purpose: Bounded orderflow capture/feature experiment.
- Producer: `~/.openclaw/workspace/crypto-updates/orderflow-spike.mjs` (sha256 `8a4ed3f0b55e`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot and Hyperliquid public streams; symbol recorded per row.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/*/raw-events.jsonl`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one normalized raw exchange event; feature CSV = one source/symbol/time bucket; databases duplicate these tables.
- Consumers: orderflow-features.mjs; orderflow-alert-replay-alignment.mjs.
- Known gaps/caps: Finite experiments, not continuous full-history coverage. Workspace source mirror status is recorded in the D1b manifest; host-bearing orderflow-spike.mjs remains excluded.
- Observed size: **8 files; 384,081,652 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T22:49:37.637997+00:00` / `2026-08-22T10:39:38.071215+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-10T22:49:37.637997+00:00` / `2026-08-22T10:39:38.071215+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/raw-events.jsonl`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/raw-events.jsonl`; rows: `855975`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S034](#schema-s034). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `ts`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"ts:integer": [1787387962198, 1787395177745]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"ts":1787387962198,"source":"hyperliquid","type":"trade","symbol":"BTC","price":77172,"quantity":0.01461,"side":"B","bid":null,"ask":null,"…":"shortened"}
```


### D117 — Orderflow spike features

- Purpose: Bounded orderflow capture/feature experiment.
- Producer: `~/.openclaw/workspace/crypto-updates/orderflow-features.mjs` (sha256 `40c96e7c5df2`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot and Hyperliquid public streams; symbol recorded per row.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/*/features-1s.csv`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one normalized raw exchange event; feature CSV = one source/symbol/time bucket; databases duplicate these tables.
- Consumers: orderflow-features.mjs; orderflow-alert-replay-alignment.mjs.
- Known gaps/caps: Finite experiments, not continuous full-history coverage. Workspace source mirror status is recorded in the D1b manifest; host-bearing orderflow-spike.mjs remains excluded.
- Observed size: **6 files; 2,972,060 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T22:55:58.631695+00:00` / `2026-08-22T10:43:24.872430+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-10T22:55:58.631695+00:00` / `2026-08-22T10:43:24.872430+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-1s.csv`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-1s.csv`; rows: `11519`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S035](#schema-s035). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"bucket_start_ms":"1787387962000","bucket_iso":"2026-08-22T08:39:22.000Z","bucket_seconds":"1","source":"hyperliquid","symbol":"BTC","trade_count":"2","buy_taker_qty":"0.01461","sell_taker_qty":"0.00581","signed_qty":"0.008799999999999999","…":"shortened"}
```


### D118 — Orderflow spike databases

- Purpose: Bounded orderflow capture/feature experiment.
- Producer: `~/.openclaw/workspace/crypto-updates/orderflow-spike.mjs` (sha256 `8a4ed3f0b55e`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot and Hyperliquid public streams; symbol recorded per row.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/*/*.sqlite`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one normalized raw exchange event; feature CSV = one source/symbol/time bucket; databases duplicate these tables.
- Consumers: orderflow-features.mjs; orderflow-alert-replay-alignment.mjs.
- Known gaps/caps: Finite experiments, not continuous full-history coverage. Workspace source mirror status is recorded in the D1b manifest; host-bearing orderflow-spike.mjs remains excluded.
- Observed size: **14 files; 302,837,760 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T22:49:37.639997+00:00` / `2026-08-22T10:43:24.823429+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-10T22:49:37.639997+00:00` / `2026-08-22T10:43:24.823429+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features.sqlite`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features.sqlite`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D119 — Orderflow spike manifests

- Purpose: Bounded orderflow capture/feature experiment.
- Producer: `~/.openclaw/workspace/crypto-updates/orderflow-spike.mjs` (sha256 `8a4ed3f0b55e`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot and Hyperliquid public streams; symbol recorded per row.
- Location/naming: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/*/*.yaml`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one normalized raw exchange event; feature CSV = one source/symbol/time bucket; databases duplicate these tables.
- Consumers: orderflow-features.mjs; orderflow-alert-replay-alignment.mjs.
- Known gaps/caps: Finite experiments, not continuous full-history coverage. Workspace source mirror status is recorded in the D1b manifest; host-bearing orderflow-spike.mjs remains excluded.
- Observed size: **14 files; 11,647 bytes**.
- First/last available file partition-or-mtime: `2026-08-10T22:49:37.667997+00:00` / `2026-08-22T10:43:24.882430+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-10T22:49:37.667997+00:00` / `2026-08-22T10:43:24.882430+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-manifest.yaml`; inspected file: `~/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-manifest.yaml`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D120 — repo cache btc-eth-alert-edge/binance-archive-cache

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/btc-eth-alert-edge/src/binance-data.mjs` (sha256 `9f5027dab014`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot candle archives/REST.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/data/binance-archive-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/btc-eth-alert-edge/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **272 files; 3,791,307 bytes**.
- First/last available file partition-or-mtime: `2026-08-01T00:00:00+00:00` / `2026-10-16T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-11T10:22:43.731319+00:00` / `2026-10-17T06:47:39.863037+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 1,958; 2026-10-12: 1,983; 2026-10-13: 1,983; 2026-10-14: 1,983; 2026-10-15: 1,986; 2026-10-16: 1,984; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/data/binance-archive-cache/__data__spot__daily__klines__SOLUSDT__4h__SOLUSDT-4h-2026-10-16.zip.csv`; inspected file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/data/binance-archive-cache/__data__spot__daily__klines__SOLUSDT__4h__SOLUSDT-4h-2026-10-16.zip.csv`; rows: `6`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S036](#schema-s036). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"column_1":"1792108800000000","column_2":"105.44000000","column_3":"105.82000000","column_4":"104.59000000","column_5":"105.33000000","column_6":"254791.71600000","column_7":"1792123199999999","column_8":"26795400.62200000","column_9":"84430","…":"shortened"}
```


### D121 — repo btc-eth-alert-edge results

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/btc-eth-alert-edge/src/universe.mjs` writes the selected universe-summary.md/universe-snapshot.json; backtest.mjs writes edge-snapshot.json/edge-summary.md; paper-dashboard.mjs writes dashboard outputs. Other result families have dedicated demo-sim runners. Selected-file mapping resolved; exhaustive heterogeneous historical mapping not verified. Separate repo checkout, not the cron target.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/btc-eth-alert-edge/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **80 files; 3,100,667 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T08:12:37.695445+00:00` / `2026-10-09T08:12:37.707445+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.695445+00:00` / `2026-10-09T08:12:37.707445+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/results/universe-summary.md`; inspected file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/results/universe-summary.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D122 — repo btc-eth-alert-edge paper

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/btc-eth-alert-edge/src/backtest.mjs:updatePaperSignals` writes paper/signals.json; `src/repair-paper-signal-precision.mjs` can rewrite its price precision. Separate repo checkout; on-demand.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/paper/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/btc-eth-alert-edge/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **1 files; 333,006 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T08:12:37.695445+00:00` / `2026-10-09T08:12:37.695445+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.695445+00:00` / `2026-10-09T08:12:37.695445+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/paper/signals.json`; inspected file: `~/ralph-experiment-loop-lab/experiments/btc-eth-alert-edge/paper/signals.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S037](#schema-s037). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"updated":"2026-10-04T08:04:29.907Z","signals":[{"id":"ETH:4h:trend_pullback_reclaim_long:1791086400","status":"open","openedAt":1791086400,"symbol":"ETH","productId":"ETH-USD","timeframe":"4h","setup":"trend_pullback_reclaim_long","direction":"long","trend":"up","…":"shortened"},{"id":"BNB:4h:range_breakout_long:1791043200","status":"open","openedAt":1791043200,"symbol":"BNB","productId":"BNB-USD","timeframe":"4h","setup":"range_breakout_long","direction":"long","trend":"up","…":"shortened"},"…"],"precisionRepair":{"status":"complete","repairedAt":"2026-10-04T08:04:29.907Z","priceDigits":8,"beforeBadRisk":0,"afterBadRisk":0,"repaired":66,"skipped":0,"boundaries":["research_only","no_live_execution","…"]}}
```


### D123 — repo copytrading-address-intake results

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/copytrading-address-intake/src/run-hyperliquid-public-route-ledger.mjs` writes selected hyperliquid-public-route-ledger.md and .json (lines 207–208). Address-intake and delay-sample runners write their output-prefix .json/.md pairs. All use the script-relative results directory; invocation history not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/copytrading-address-intake/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/copytrading-address-intake/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **12 files; 136,420 bytes**.
- First/last available file partition-or-mtime: `2026-08-30T00:00:00+00:00` / `2026-10-09T08:12:37.710445+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.710445+00:00` / `2026-10-09T08:12:37.710445+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md`; inspected file: `~/ralph-experiment-loop-lab/experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D124 — repo liquidation-q1-baseline-kill-switch results

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs` backtest command writes JSON to --out (lines 42–47). CLI can produce major-2026-06.json, but the historical invocation tying this exact file to it is not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/liquidation-q1-baseline-kill-switch/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/liquidation-q1-baseline-kill-switch/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **1 files; 28,873 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T08:12:37.713445+00:00` / `2026-10-09T08:12:37.713445+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.713445+00:00` / `2026-10-09T08:12:37.713445+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`; inspected file: `~/ralph-experiment-loop-lab/experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S038](#schema-s038). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generatedAt":"2026-07-02T08:15:00.959Z","input":{"candleCount":25905,"liquidationCount":208486,"firstCandle":"2026-06-01T00:00:00.000Z","lastCandle":"2026-07-01T00:00:00.000Z","symbols":["BTC","ETH","…"]},"config":{"cascadeWindowMinutes":5,"rollingLiquidationLookbackWindows":288,"minLiquidationNotionalMultiple":3,"minLiquidationNotionalUsd":0,"minSameDirectionEvents":2,"entryDelayCandles":0,"entryLookaheadCandles":2,"passiveLimitOffsetPct":0.0025,"partialFillFullDepthPct":0.005,"…":"shortened"},"signalCounts":{"liquidationCascade":1001,"largeCandleReversal":17,"drawdownReversal":241},"strategies":{"liquidationCascade":{"opportunities":1001,"trades":483,"fillRate":0.4825174825174825,"winRate":0.35610766045548653,"meanReturn":-0.0011484317361505694,"meanFilledReturn":-0.0023800831633265422,"medianReturn":0,"tail5PctReturn":-0.009576830195298763,"worstReturn":-0.027000000000000107,"…":"sh … [shortened]
```


### D125 — repo cache strategy-destruction-filter/market-cache

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/strategy-destruction-filter/src/market-data.mjs` (sha256 `8b776041a340`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/strategy-destruction-filter/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **2 files; 3,406,928 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T06:47:32.028067+00:00` / `2026-10-17T06:47:40.224036+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T06:47:32.028067+00:00` / `2026-10-17T06:47:40.224036+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 3,406,928.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/h1-SOL-4h.json`; inspected file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/h1-SOL-4h.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S039](#schema-s039). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"candles":[{"time":1634544000,"open":158.85,"high":159.93,"low":156,"close":156.96,"volume":463310.91},{"time":1634558400,"open":156.97,"high":159.68,"low":155.58,"close":156.66,"volume":509570.66},"…"],"meta":{"source":"binance-public-archive-rest-tail","archiveFilesAttempted":76,"restTailStart":"2026-09-02T06:47:32.030Z","provider":"binance-spot","market":"spot"}}
```


### D126 — repo cache strategy-destruction-filter/market-cache/h2

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/strategy-destruction-filter/src/h2-contract.mjs` (sha256 `01fdd8ab9aaa`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot candle archives/REST.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/h2/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/strategy-destruction-filter/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **2 files; 1,709,776 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T07:00:53.722925+00:00` / `2026-10-17T07:00:53.817925+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T07:00:53.722925+00:00` / `2026-10-17T07:00:53.817925+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 1,709,776.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/h2/d86acd4bbd1ce0048c5d41c67a16faf0270747fb1e395f6c81c063a219bc30fd.json`; inspected file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/data/market-cache/h2/d86acd4bbd1ce0048c5d41c67a16faf0270747fb1e395f6c81c063a219bc30fd.json`; rows: `8760`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S040](#schema-s040). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `time`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"time:integer": [1634515200, 1760644800]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":1634515200,"open":160.11,"high":162.98,"low":159.06,"close":159.92,"volume":390300.89}
```


### D127 — repo strategy-destruction-filter results

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/strategy-destruction-filter/src/` runners write named research reports; selected h3a-action-log.md is an operator-maintained action log, not generated by a strategy runner. Exhaustive file-to-writer history not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/strategy-destruction-filter/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **63 files; 15,308,687 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T08:12:37.714445+00:00` / `2026-10-17T12:32:38.945761+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.714445+00:00` / `2026-10-17T12:32:38.945761+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 516,608.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/results/h3a-action-log.md`; inspected file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/results/h3a-action-log.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D128 — repo strategy-destruction-filter runtime

- Purpose: Experiment results/state/report collection.
- Producer: runtime/h1-fetch.mjs is a local helper source artifact, not a dataset emitted by the strategy runner. Its authoring command and other heterogeneous runtime writers are not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/runtime/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/strategy-destruction-filter/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **1 files; 708 bytes**.
- First/last available file partition-or-mtime: `2026-10-17T06:47:24.433096+00:00` / `2026-10-17T06:47:24.433096+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-17T06:47:24.433096+00:00` / `2026-10-17T06:47:24.433096+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 708.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/runtime/h1-fetch.mjs`; inspected file: `~/ralph-experiment-loop-lab/experiments/strategy-destruction-filter/runtime/h1-fetch.mjs`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D129 — repo volume-velocity-dex-discrepancy results

- Purpose: Experiment results/state/report collection.
- Producer: `experiments/volume-velocity-dex-discrepancy/src/run-e2e-latency-baseline.mjs` writes e2e-latency-samples.jsonl, e2e-latency-summary.json and the selected e2e-latency-summary.md (lines 107–109); on-demand, separate repo checkout.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/ralph-experiment-loop-lab/experiments/volume-velocity-dex-discrepancy/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/volume-velocity-dex-discrepancy/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **3 files; 173,794 bytes**.
- First/last available file partition-or-mtime: `2026-10-09T08:12:37.751446+00:00` / `2026-10-09T08:12:37.751446+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-09T08:12:37.751446+00:00` / `2026-10-09T08:12:37.751446+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/ralph-experiment-loop-lab/experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.md`; inspected file: `~/ralph-experiment-loop-lab/experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D130 — workspace cache btc-eth-alert-edge/binance-archive-cache

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/btc-eth-alert-edge/src/binance-data.mjs` (sha256 `9f5027dab014`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance spot candle archives/REST.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-archive-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/btc-eth-alert-edge/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **2088 files; 59,419,087 bytes**.
- First/last available file partition-or-mtime: `2026-08-01T00:00:00+00:00` / `2026-10-13T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-11T10:22:34.771256+00:00` / `2026-10-14T04:04:39.400715+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 42,019; 2026-10-12: 42,400; 2026-10-13: 42,373; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-archive-cache/__data__spot__daily__klines__XRPUSDT__4h__XRPUSDT-4h-2026-10-13.zip.csv`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-archive-cache/__data__spot__daily__klines__XRPUSDT__4h__XRPUSDT-4h-2026-10-13.zip.csv`; rows: `6`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S036](#schema-s036). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"column_1":"1791849600000000","column_2":"1.34210000","column_3":"1.37570000","column_4":"1.31120000","column_5":"1.36810000","column_6":"33430005.20000000","column_7":"1791863999999999","column_8":"44952972.53163000","column_9":"156689","…":"shortened"}
```


### D131 — workspace cache btc-eth-alert-edge/binance-usdm-archive-cache

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs` (sha256 `3d66cb3ea6d4`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: Binance USD-M daily trades.
- Location/naming: box `research/binance-usdm-archive-cache/*.csv.zst` (`zstd -9`); original local root `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/`.
- W1 archive move: local copy removed 2026-10-19. Manifest: [docs/archive-moves/w1-2026-10-19.csv](archive-moves/w1-2026-10-19.csv); box copy `research/manifests/w1-2026-10-19.csv`.
- Restore: rsync back from box `research/binance-usdm-archive-cache/` to the original local root, then `zstd -d` the `.zst` files. `binance-usdm-archive.mjs` re-downloads missing files on demand (ENOENT → fetch → cache write).
- Historical snapshot: sizes and local inspected-file paths below describe pre-removal storage, not files currently on disk.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/btc-eth-alert-edge/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **289 files; 17,463,153,666 bytes**.
- First/last available file partition-or-mtime: `2025-01-01T00:00:00+00:00` / `2026-09-27T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-09-28T21:56:33.943489+00:00` / `2026-09-29T16:53:54.652830+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__XRPUSDT__XRPUSDT-trades-2026-09-27.zip.csv`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__XRPUSDT__XRPUSDT-trades-2026-09-27.zip.csv`; rows: `1766674`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S041](#schema-s041). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"id":"3334987641","price":"1.5265","qty":"1.2","quote_qty":"1.8318","time":"1790467200003","is_buyer_maker":"false"}
```


### D132 — workspace cache btc-eth-alert-edge/candles

- Purpose: Reusable offline experiment inputs.
- Producer: workspace `ralph-research-os/experiments/btc-eth-alert-edge/src/backtest.mjs:loadCandles` writes data/candles caches via writeJson; Binance input comes from binance-data.mjs. Enabled alert-edge cron invokes npm backtest in this workspace tree.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/candles/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/btc-eth-alert-edge/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **22 files; 9,623,459 bytes**.
- First/last available file partition-or-mtime: `2026-08-11T09:59:31.968403+00:00` / `2026-10-14T12:04:26.688914+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-11T09:59:31.968403+00:00` / `2026-10-14T12:04:26.688914+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 7,949,847; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/candles/binance-spot-AVAXUSDT-4h.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/candles/binance-spot-AVAXUSDT-4h.json`; rows: `2160`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S040](#schema-s040). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `time`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"time:integer": [1760889600, 1791979200]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":1760889600,"open":20.74,"high":20.84,"low":20.54,"close":20.73,"volume":411215.66}
```


### D133 — workspace cache btc-eth-alert-edge/funding

- Purpose: Reusable offline experiment inputs.
- Producer: workspace `ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-funding-persistence-context-baseline.mjs` writes hyperliquid-funding-history-demo-sim.json via writeJson(FUNDING_CACHE_PATH, cache). Package script demo-sim:funding-persistence; not included in the current cron demo-sim:all command. Historical invocation not verified.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/funding/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/btc-eth-alert-edge/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **1 files; 838,281 bytes**.
- First/last available file partition-or-mtime: `2026-09-27T07:18:06.552935+00:00` / `2026-09-27T07:18:06.552935+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-09-27T07:18:06.552935+00:00` / `2026-09-27T07:18:06.552935+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/funding/hyperliquid-funding-history-demo-sim.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/funding/hyperliquid-funding-history-demo-sim.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S042](#schema-s042). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"fetchedAt":"2026-09-27T07:18:06.548Z","source":"https://api.hyperliquid.xyz/info","requests":{"metaAndAssetCtxs":true,"fundingHistoryCoins":["ADA","AVAX","…"],"startTimeMs":1786147200000,"endTimeMs":1790712000000},"window":{"startTime":1786406400,"endTime":1790452800,"startTimeIso":"2026-08-11T00:00:00.000Z","endTimeIso":"2026-09-26T20:00:00.000Z"},"totals":{"requestedCoins":9,"availableCoins":9,"unavailableCoins":0,"fetchErrors":0,"fundingRows":4500},"unavailableCoins":[],"fetchErrors":[],"fundingByCoin":{"ADA":[{"coin":"…","fundingRate":"…","premium":"…","time":"…","timeIso":"…"},{"coin":"…","fundingRate":"…","premium":"…","time":"…","timeIso":"…"},"…"],"AVAX":[{"coin":"…","fundingRate":"…","premium":"…","time":"…","timeIso":"…"},{"coin":"…","fundingRate":"…","premium":"…","time":"…","timeIso":"…"},"…"],"BNB":[{"coin":"…","fundingRate":"…","premium":"…","time":"…","timeIso":"…"},{"co … [shortened]
```


### D134 — workspace btc-eth-alert-edge results

- Purpose: Experiment results/state/report collection.
- Producer: workspace `crypto-updates/index-trade-research-journal.mjs` writes the selected live-ta-execution-journal.md; backtest/universe/demo-sim runners write their named result families. Enabled alert-edge cron explicitly invokes these indexers/runners. Full heterogeneous historical mapping not verified; personal journal contents not inspected.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/btc-eth-alert-edge/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **80 files; 3,100,234 bytes**.
- First/last available file partition-or-mtime: `2026-08-21T20:31:21.425964+00:00` / `2026-10-16T18:42:12.480629+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-21T20:31:21.425964+00:00` / `2026-10-16T18:42:12.480629+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 1,376,243; 2026-10-15: 0; 2026-10-16: 21,519; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/results/live-ta-execution-journal.md`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/results/live-ta-execution-journal.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D135 — workspace btc-eth-alert-edge paper

- Purpose: Experiment results/state/report collection.
- Producer: workspace `ralph-research-os/experiments/btc-eth-alert-edge/src/backtest.mjs:updatePaperSignals` writes paper/signals.json; repair-paper-signal-precision.mjs can rewrite it. Both are explicitly reached by the enabled alert-edge cron (backtest and demo-sim:all).
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/paper/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/btc-eth-alert-edge/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **1 files; 330,241 bytes**.
- First/last available file partition-or-mtime: `2026-10-14T12:04:36.582877+00:00` / `2026-10-14T12:04:36.582877+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-14T12:04:36.582877+00:00` / `2026-10-14T12:04:36.582877+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 330,241; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/paper/signals.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/paper/signals.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S037](#schema-s037). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"updated":"2026-10-14T12:04:36.581Z","signals":[{"id":"BNB:1h:trend_pullback_reject_short:1791925200","status":"open","openedAt":1791925200,"symbol":"BNB","productId":"BNB-USD","timeframe":"1h","setup":"trend_pullback_reject_short","direction":"short","trend":"down","…":"shortened"},{"id":"BTC:4h:trend_pullback_reject_short:1791921600","status":"open","openedAt":1791921600,"symbol":"BTC","productId":"BTC-USD","timeframe":"4h","setup":"trend_pullback_reject_short","direction":"short","trend":"down","…":"shortened"},"…"],"precisionRepair":{"status":"complete","repairedAt":"2026-10-14T12:04:36.581Z","priceDigits":8,"beforeBadRisk":0,"afterBadRisk":0,"repaired":51,"skipped":0,"boundaries":["research_only","no_live_execution","…"]}}
```


### D136 — workspace cache copytrading-address-intake/.

- Purpose: Reusable offline experiment inputs.
- Producer: not verified. Public-route-ledger code fetches leaderboard metadata but inspected runners write results, not the selected data/public-leaderboard-addresses-2026-08-30.json seed file. No exact writer found in repo/workspace source, units, crontab or cron prompts; a consumer is not a producer.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/data/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/copytrading-address-intake/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **2 files; 1,966 bytes**.
- First/last available file partition-or-mtime: `2026-08-27T16:37:26.329347+00:00` / `2026-08-30T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-27T16:37:26.329347+00:00` / `2026-08-30T06:13:29.925120+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json`; rows: `6`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S043](#schema-s043). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"address":"[omitted]","source":"Hyperliquid public stats leaderboard top all-time PnL row; inactive recent-volume risk","initialStatus":"watch/leaderboard-seed"}
```


### D137 — workspace copytrading-address-intake results

- Purpose: Experiment results/state/report collection.
- Producer: workspace `ralph-research-os/experiments/copytrading-address-intake/src/run-hyperliquid-delay-sample.mjs` writes selected output-prefix hyperliquid-wallet-shadow-delay-sample-2026-09-01.md plus JSON (lines 250–251). Other result prefixes are written by intake/route-ledger runners. Exact historical command not verified; no fixed scheduler command found.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/copytrading-address-intake/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **12 files; 136,420 bytes**.
- First/last available file partition-or-mtime: `2026-08-27T16:38:18.400680+00:00` / `2026-09-01T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-27T16:38:18.400680+00:00` / `2026-09-01T06:44:02.551832+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.md`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D138 — workspace cache liquidation-q1-baseline-kill-switch/major-2026-06

- Purpose: Reusable offline experiment inputs.
- Producer: workspace `ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs:fetchWindow` writes candles.json and liquidations.json under --out (lines 115–118). Exact --out major-2026-06 historical invocation not verified; no fetch or paid API call was made.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/liquidation-q1-baseline-kill-switch/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **2 files; 108,801,372 bytes**.
- First/last available file partition-or-mtime: `2026-07-02T08:10:34.788929+00:00` / `2026-07-02T08:10:35.538935+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-07-02T08:10:34.788929+00:00` / `2026-07-02T08:10:35.538935+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06/liquidations.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06/liquidations.json`; rows: `208486`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S044](#schema-s044). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema: none established by the stored inspection evidence.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"symbol":"BTC","coin":"BTC","timestamp":"2026-06-01T00:43:48.608Z","liquidated_user":"[omitted]","liquidator_user":"[omitted]","price":"73941","size":"0.00166","side":"A","mark_price":"73942","…":"shortened"}
```


### D139 — workspace liquidation-q1-baseline-kill-switch results

- Purpose: Experiment results/state/report collection.
- Producer: workspace `ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs` backtest command writes JSON to --out. Historical invocation producing major-2026-06.json is not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/liquidation-q1-baseline-kill-switch/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **1 files; 28,873 bytes**.
- First/last available file partition-or-mtime: `2026-07-02T08:15:00.959978+00:00` / `2026-07-02T08:15:00.959978+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-07-02T08:15:00.959978+00:00` / `2026-07-02T08:15:00.959978+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`; rows: `1`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S038](#schema-s038). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"generatedAt":"2026-07-02T08:15:00.959Z","input":{"candleCount":25905,"liquidationCount":208486,"firstCandle":"2026-06-01T00:00:00.000Z","lastCandle":"2026-07-01T00:00:00.000Z","symbols":["BTC","ETH","…"]},"config":{"cascadeWindowMinutes":5,"rollingLiquidationLookbackWindows":288,"minLiquidationNotionalMultiple":3,"minLiquidationNotionalUsd":0,"minSameDirectionEvents":2,"entryDelayCandles":0,"entryLookaheadCandles":2,"passiveLimitOffsetPct":0.0025,"partialFillFullDepthPct":0.005,"…":"shortened"},"signalCounts":{"liquidationCascade":1001,"largeCandleReversal":17,"drawdownReversal":241},"strategies":{"liquidationCascade":{"opportunities":1001,"trades":483,"fillRate":0.4825174825174825,"winRate":0.35610766045548653,"meanReturn":-0.0011484317361505694,"meanFilledReturn":-0.0023800831633265422,"medianReturn":0,"tail5PctReturn":-0.009576830195298763,"worstReturn":-0.027000000000000107,"…":"sh … [shortened]
```


### D140 — workspace cache strategy-destruction-filter/aggtrades-cache

- Purpose: Reusable offline experiment inputs.
- Producer: workspace `ralph-research-os/experiments/strategy-destruction-filter/src/replay-binance-aggtrades-velocity.mjs` builds data/aggtrades-cache/<symbol>-<startMs>-<endMs>.json and writes deduped rows (cacheFile/writeFile). This replay runner is distinct from the cron study:aggtrades-velocity runner; historical trigger not verified.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/aggtrades-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/strategy-destruction-filter/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **57 files; 145,302,393 bytes**.
- First/last available file partition-or-mtime: `2026-08-26T08:00:04.735017+00:00` / `2026-08-26T08:06:05.647212+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-26T08:00:04.735017+00:00` / `2026-08-26T08:06:05.647212+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/aggtrades-cache/ETHUSDT-1787691727789-1787692087789.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/aggtrades-cache/ETHUSDT-1787691727789-1787692087789.json`; rows: `11281`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S045](#schema-s045). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `time`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"time:integer": [1787691728202, 1787692087787]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"id":2065800660,"price":2435.57,"quantity":0.3394,"time":1787691728202,"notional":826.632458,"buyerIsMaker":true,"takerSide":"sell"}
```


### D141 — workspace cache strategy-destruction-filter/market-cache

- Purpose: Reusable offline experiment inputs.
- Producer: `experiments/strategy-destruction-filter/src/market-data.mjs` (sha256 `8b776041a340`). Unit/trigger: writer matrix above; on-demand if not listed as a service.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/market-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/strategy-destruction-filter/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **55 files; 47,270,299 bytes**.
- First/last available file partition-or-mtime: `2021-08-23T00:00:00+00:00` / `2024-12-05T00:00:00+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-22T04:44:28.360572+00:00` / `2026-09-28T14:55:08.731379+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/market-cache/bybit-linear-HYPEUSDT-open-interest-4h-2024-12-05-2026-09-28.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/market-cache/bybit-linear-HYPEUSDT-open-interest-4h-2024-12-05-2026-09-28.json`; rows: `3972`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S046](#schema-s046). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `time`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"time:integer": [1733414400, 1790596800]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"time":1733414400,"openInterest":206001.28}
```


### D142 — workspace cache strategy-destruction-filter/planned-level-aggtrades-cache

- Purpose: Reusable offline experiment inputs.
- Producer: workspace `ralph-research-os/experiments/strategy-destruction-filter/src/run-planned-level-proxy-replay.mjs` builds data/planned-level-aggtrades-cache and writes cacheFile JSON; on-demand, no fixed cron command found.
- Source: not verified; inspect source/cache metadata.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/planned-level-aggtrades-cache/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: one OHLCV candle, archive trade, or cache envelope (see inspected schema).
- Consumers: experiments/strategy-destruction-filter/src/*.mjs.
- Known gaps/caps: Static/rolling caches, not stream continuity; no automatic retention verified. H2 is content-addressed frozen OHLCV, not a complete orderflow input contract.
- Observed size: **12 files; 15,499,704 bytes**.
- First/last available file partition-or-mtime: `2026-09-12T18:36:16.009997+00:00` / `2026-09-28T08:58:49.930190+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-09-12T18:36:16.009997+00:00` / `2026-09-28T08:58:49.930190+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/planned-level-aggtrades-cache/BTCUSDT-1790470500000-1790471400000.json`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/data/planned-level-aggtrades-cache/BTCUSDT-1790470500000-1790471400000.json`; rows: `1717`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S047](#schema-s047). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: `time`. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.
- Selected-file verified integer epoch extrema (stored inspection evidence, not global coverage): `{"time:integer": [1790470501722, 1790471399876]}`.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"id":4074625204,"price":84306.01,"quantity":0.00011,"time":1790470501722,"notional":9.2736611,"buyerIsMaker":false,"takerSide":"buy"}
```


### D143 — workspace strategy-destruction-filter results

- Purpose: Experiment results/state/report collection.
- Producer: workspace `ralph-research-os/experiments/strategy-destruction-filter/src/run-aggtrades-velocity-event-study.mjs` writes the selected aggtrades-velocity-event-study.md/.json; shadow-ledger and wick-feedback runners write their named reports. Enabled alert-edge cron invokes study:aggtrades-velocity, ledger:shadow-pnl and study:wick-feedback. Exhaustive heterogeneous history not verified.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/strategy-destruction-filter/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **48 files; 14,812,934 bytes**.
- First/last available file partition-or-mtime: `2026-08-26T08:22:39.677627+00:00` / `2026-10-14T12:05:12.950742+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-08-26T08:22:39.677627+00:00` / `2026-10-14T12:05:12.950742+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 237,458; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/results/aggtrades-velocity-event-study.md`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter/results/aggtrades-velocity-event-study.md`; rows: `None`; read stability: `not verified`; status: unsupported format; metadata only.
- Field names/types/units/time fields/example: **not verified** (no eligible structured sample; personal exceptions handled separately).


### D144 — workspace volume-velocity-dex-discrepancy results

- Purpose: Experiment results/state/report collection.
- Producer: workspace-only `ralph-research-os/experiments/volume-velocity-dex-discrepancy/src/normalize-replay-warehouse-rows.mjs` writes selected normalized-replay-input.jsonl (DEFAULT_OUTPUT, writeFile at line 20); run-e2e-latency-baseline.mjs writes e2e reports. Normalizer source was absent from the pre-D1b public repo and is now mirrored byte-for-byte; see the D1b hash manifest.
- Source: Local experiments and their input caches; symbol/source varies by run.
- Location/naming: `~/.openclaw/workspace/ralph-research-os/experiments/volume-velocity-dex-discrepancy/results/**/*`.
- Rotation/compression/retention: `static`; format/compression is encoded by suffix (`gz` gzip, `xz` LZMA, `zip` archive). Hourly tapes/raw are maintained by the hourly service; other retention **not verified**, no automatic deletion assumed.
- Row definition: heterogeneous: report document, result object, replay row or state; newest file only is sampled.
- Consumers: experiments/volume-velocity-dex-discrepancy/src plus operator.
- Known gaps/caps: Grouped heterogeneous outputs; not a single homogeneous schema. Per-file producer mapping and historical parameters not verified; counts include nested results.
- Observed size: **48 files; 1,033,581 bytes**.
- First/last available file partition-or-mtime: `2026-10-04T22:06:22.732615+00:00` / `2026-10-05T15:51:56.684600+00:00`. Earliest exchange timestamp across all files **not verified** unless a fixed H2 window is stated above.
- First/last mtime: `2026-10-04T22:06:22.732615+00:00` / `2026-10-05T15:51:56.834601+00:00`.
- Stored bytes/day (UTC; today partial): 2026-10-11: 0; 2026-10-12: 0; 2026-10-13: 0; 2026-10-14: 0; 2026-10-15: 0; 2026-10-16: 0; 2026-10-17: 0.
- Rows/hour: not applicable/not verified (static, state, profile, personal or unsupported format).
- Newest eligible complete file: `~/.openclaw/workspace/ralph-research-os/experiments/volume-velocity-dex-discrepancy/results/normalized-replay-input.jsonl`; inspected file: `~/.openclaw/workspace/ralph-research-os/experiments/volume-velocity-dex-discrepancy/results/normalized-replay-input.jsonl`; rows: `2`; read stability: `True`; status: closed-partition sample.
- Every observed field/type: [Schema S048](#schema-s048). Units and meanings are given there or in the shared dictionary; unresolved meanings explicitly remain not verified.
- Verified integer epoch time fields: none established by the stored inspection evidence. ISO strings, duration fields and event-type labels are not integer epoch fields; other nested candidates require reinspection.

Real selected-file example, shortened (not necessarily valid JSON after shortening):

```text
{"eventId":"warehouse-negative-001","status":"research-only-no-live-execution","source":"warehouse_fixture","chain":"avalanche","pair":"WAVAX/USDC","observedAt":"2026-10-05T00:00:00.000Z","blockNumber":0,"txHash":null,"logIndex":0,"…":"shortened"}
```


### D145 — Personal sessions

Personal category only: **1168 files; 87,294,121 bytes**.


### D146 — Personal voice and media

Personal category only: **313 files; 45,925,194 bytes**.


### D147 — Personal memory

Personal category only: **49 files; 649,800 bytes**.


### D148 — Personal chat-derived wiki

Personal category only: **673 files; 2,067,475 bytes**.


### D149 — Personal backups

Personal category only: **4 files; 996,166,616 bytes**.


### D150 — Personal transcript scratch

Personal category only: **7 files; 4,118,919 bytes**.


### D151 — Personal speech scratch

Personal category only: **5 files; 1,803,097 bytes**.


## Observed schema register

Schema union is exhaustive for the selected file, not for all historical files. CSV values are physical strings; see the logical units/definitions. Array element paths denote all observed element types, not tuple positions (tuple meanings are specified above). `<cache-key>` expands to `provider:symbol:startMs:endMs`; it is a map key, not an extra field. Unknown historical/proprietary semantics are not guessed.


### Schema S001

First used by: BTCUSDT raw.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `data` | object | container | nested record/array; child fields and tuple meanings define contents |
| `data.A` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.B` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.E` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.P` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.T` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.U` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.a` | array / integer / string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.a[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `data.a[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `data.ap` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.b` | array / string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.b[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `data.b[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `data.e` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.f` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.i` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.l` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.m` | boolean | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.nq` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.openInterest` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.p` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.ps` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.pu` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.q` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.r` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.s` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.st` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.symbol` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.time` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.u` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `recv_ms` | integer | epoch ms | local receive time |
| `src` | string | label | source/transport/venue discriminator |
| `stream` | string | container/label | source stream payload/discriminator; raw variant table above |

### Schema S002

First used by: BTCUSDT tape.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `AggId` | string | identifier | exchange aggregate/constituent trade ID |
| `Ask` | string | quote/base | trade/synthetic opposite price; not observed BBO |
| `Bids` | string | quote/base | trade/synthetic opposite price; not observed BBO |
| `Delta` | string | base units | hour-local cumulative bought−sold |
| `Time` | string | local clock text | rendering of exchange trade time, not receipt |
| `TradeTimeMs` | string | epoch ms | exchange trade timestamp |
| `column_3` | string | base units | ATAS tape aggressive sell / aggressive buy quantity, respectively |
| `column_4` | string | constant | ATAS tape reserved zero |
| `column_5` | string | base units | ATAS tape aggressive sell / aggressive buy quantity, respectively |

### Schema S003

First used by: BTCUSDT book.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `a` | array | container | nested record/array; child fields and tuple meanings define contents |
| `a[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `a[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `b` | array | container | nested record/array; child fields and tuple meanings define contents |
| `b[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `b[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `u` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S004

First used by: BTCUSDT bars.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `absorb_candle` | string | label | event-specific classification/discriminator |
| `absorb_high` | string | flag | partial-session or derived heuristic flag |
| `absorb_low` | string | flag | partial-session or derived heuristic flag |
| `ask_depth` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `ask_wall_px` | string | quote/base | price or level; exact definition in common field dictionary |
| `ask_wall_qty` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `best_ask` | string | quote/base | price or level; exact definition in common field dictionary |
| `best_bid` | string | quote/base | price or level; exact definition in common field dictionary |
| `bid_depth` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bid_wall_px` | string | quote/base | price or level; exact definition in common field dictionary |
| `bid_wall_qty` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `big_bought` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `big_count` | string | count | observations/levels; see common dictionary |
| `big_max` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `big_max_side` | string | label | event-specific classification/discriminator |
| `big_sold` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `book_imb` | string | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bought` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `buy_imb` | string | count | observations/levels; see common dictionary |
| `close` | string | quote/base | price or level; exact definition in common field dictionary |
| `cluster_hits` | string | count | observations/levels; see common dictionary |
| `cvd_session` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `d_oi` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `delta` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `delta_pct` | string | percent | 100 × delta / volume |
| `exhaust_high` | string | flag | partial-session or derived heuristic flag |
| `exhaust_low` | string | flag | partial-session or derived heuristic flag |
| `funding` | string | fraction | published funding rate, not percentage points |
| `high` | string | quote/base | price or level; exact definition in common field dictionary |
| `index` | string | quote/base | price or level; exact definition in common field dictionary |
| `liq_count` | string | count | observations/levels; see common dictionary |
| `liq_long` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `liq_short` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `low` | string | quote/base | price or level; exact definition in common field dictionary |
| `mark` | string | quote/base | price or level; exact definition in common field dictionary |
| `max_delta` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `min_delta` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `naked_poc_above` | string | quote/base | price or level; exact definition in common field dictionary |
| `naked_poc_below` | string | quote/base | price or level; exact definition in common field dictionary |
| `oi` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `open` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_high` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_low` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_poc` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_vah` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_val` | string | quote/base | price or level; exact definition in common field dictionary |
| `pd_vwap` | string | quote/base | price or level; exact definition in common field dictionary |
| `poc` | string | quote/base | price or level; exact definition in common field dictionary |
| `poc_vol` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `premium` | string | quote/base | weighted deviation width or mark−index premium |
| `s_high` | string | quote/base | price or level; exact definition in common field dictionary |
| `s_low` | string | quote/base | price or level; exact definition in common field dictionary |
| `s_poc` | string | quote/base | price or level; exact definition in common field dictionary |
| `s_vah` | string | quote/base | price or level; exact definition in common field dictionary |
| `s_val` | string | quote/base | price or level; exact definition in common field dictionary |
| `sell_imb` | string | count | observations/levels; see common dictionary |
| `sold` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `spread` | string | quote/base | price or level; exact definition in common field dictionary |
| `stack_buy` | string | count | observations/levels; see common dictionary |
| `stack_sell` | string | count | observations/levels; see common dictionary |
| `t_ms` | string | epoch ms | exchange-derived closed-bar start |
| `time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `trades` | string | count | observations/levels; see common dictionary |
| `vel_max` | string | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `volume` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `vwap` | string | quote/base | price or level; exact definition in common field dictionary |
| `vwap_dist_sd` | string | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `vwap_sd` | string | quote/base | weighted deviation width or mark−index premium |
| `wvwap` | string | quote/base | price or level; exact definition in common field dictionary |
| `wvwap_dist_sd` | string | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `wvwap_sd` | string | quote/base | weighted deviation width or mark−index premium |

### Schema S005

First used by: BTCUSDT events.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `avg_price` | number | quote/base | price or level; exact definition in common field dictionary |
| `bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `from` | number | not verified | not verified from inspected local source; unresolved |
| `from_day` | string | UTC date | session/archive/origin day, not local receive time |
| `kind` | string | label | event-specific classification/discriminator |
| `levels` | integer | count | observations/levels; see common dictionary |
| `liquidated` | string | label | event-specific classification/discriminator |
| `move_pct` | number | not verified | not verified from inspected local source; unresolved |
| `notional_5s` | integer | not verified | not verified from inspected local source; unresolved |
| `price` | number | quote/base | price or level; exact definition in common field dictionary |
| `qty` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `ratio` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `side` | string | label | event-specific classification/discriminator |
| `sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `to` | number | not verified | not verified from inspected local source; unresolved |
| `trades` | integer | count | observations/levels; see common dictionary |
| `type` | string | label | event-specific classification/discriminator |
| `volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `window_s` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S006

First used by: BTCUSDT footprints.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `step` | number | quote/base | footprint price bin width |
| `t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |

### Schema S007

First used by: BTCUSDT profiles.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `Asks` | string | base units | profile total / sell / buy quantity |
| `Bid` | string | base units | profile total / sell / buy quantity |
| `Delta` | string | base units | hour-local cumulative bought−sold |
| `Price` | string | quote/base | exact session profile price |
| `Trades` | string | count | profile aggregate trade count |
| `Volume` | string | base units | profile total / sell / buy quantity |

### Schema S008

First used by: BTCUSDT sessions.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bought` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `close` | string | quote/base | price or level; exact definition in common field dictionary |
| `day` | string | UTC date | session/archive/origin day, not local receive time |
| `delta` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `high` | string | quote/base | price or level; exact definition in common field dictionary |
| `low` | string | quote/base | price or level; exact definition in common field dictionary |
| `open` | string | quote/base | price or level; exact definition in common field dictionary |
| `partial` | string | flag | partial-session or derived heuristic flag |
| `poc` | string | quote/base | price or level; exact definition in common field dictionary |
| `sold` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `trades` | string | count | observations/levels; see common dictionary |
| `vah` | string | quote/base | price or level; exact definition in common field dictionary |
| `val` | string | quote/base | price or level; exact definition in common field dictionary |
| `volume` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `vwap` | string | quote/base | price or level; exact definition in common field dictionary |

### Schema S009

First used by: BTCUSDT live snapshot.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bars` | array | container | nested record/array; child fields and tuple meanings define contents |
| `bars[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `bars[].absorb_candle` | null / string | label | event-specific classification/discriminator |
| `bars[].big_max` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].big_max_side` | null / string | label | event-specific classification/discriminator |
| `bars[].book_imb` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].buy_imb` | number | count | observations/levels; see common dictionary |
| `bars[].close` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].cvd_session` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].d_oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].high` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].liq_long` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].liq_short` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].low` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].open` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_val` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].sell_imb` | number | count | observations/levels; see common dictionary |
| `bars[].sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].stack_buy` | number | count | observations/levels; see common dictionary |
| `bars[].stack_sell` | number | count | observations/levels; see common dictionary |
| `bars[].t_ms` | number | epoch ms | exchange-derived closed-bar start |
| `bars[].vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].vwap_sd` | number | quote/base | weighted deviation width or mark−index premium |
| `collector` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.backfilled` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.book.asks` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.bids` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.resyncs` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.state` | string | not verified | not verified from inspected local source; unresolved |
| `collector.data_dir` | string | not verified | not verified from inspected local source; unresolved |
| `collector.delay_ms` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.gaps` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.liquidations` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.started` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.trades` | integer | count | observations/levels; see common dictionary |
| `events` | array | container | nested record/array; child fields and tuple meanings define contents |
| `events[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `events[].avg_price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].from` | number | not verified | not verified from inspected local source; unresolved |
| `events[].kind` | string | label | event-specific classification/discriminator |
| `events[].levels` | integer | count | observations/levels; see common dictionary |
| `events[].liquidated` | string | label | event-specific classification/discriminator |
| `events[].price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].qty` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].ratio` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `events[].side` | string | label | event-specific classification/discriminator |
| `events[].sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].to` | number | not verified | not verified from inspected local source; unresolved |
| `events[].trades` | integer | count | observations/levels; see common dictionary |
| `events[].type` | string | label | event-specific classification/discriminator |
| `events[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `footprints` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].step` | number | quote/base | footprint price bin width |
| `footprints[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `generated` | integer | epoch ms | local snapshot generation time |
| `status` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar.bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.close` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.bar.vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `status.bar.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar_fp` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.step` | number | quote/base | footprint price bin width |
| `status.bar_fp.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.ask_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.best_ask` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.best_bid` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.bid_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.bid_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.imbalance` | number | not verified | not verified from inspected local source; unresolved |
| `status.last_price` | number | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.liq_5m.count` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.long` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.short` | integer | not verified | not verified from inspected local source; unresolved |
| `status.mark` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.mark.funding` | string | fraction | published funding rate, not percentage points |
| `status.mark.index` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.mark` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.next_funding` | integer | not verified | not verified from inspected local source; unresolved |
| `status.naked` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.naked[]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.prev_day` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.prev_day.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.session.cvd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.day` | string | UTC date | session/archive/origin day, not local receive time |
| `status.session.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.sd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.session.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.velocity` | number | not verified | not verified from inspected local source; unresolved |
| `tf` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S010

First used by: BTCUSDT engine state.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `naked` | array | container | nested record/array; child fields and tuple meanings define contents |
| `naked[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `naked[][]` | number / string | container | nested record/array; child fields and tuple meanings define contents |
| `prev` | array | container | nested record/array; child fields and tuple meanings define contents |
| `prev[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `prev[].high` | number | quote/base | price or level; exact definition in common field dictionary |
| `prev[].low` | number | quote/base | price or level; exact definition in common field dictionary |
| `prev[].poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `prev[].vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `prev[].val` | number | quote/base | price or level; exact definition in common field dictionary |
| `prev[].vwap` | number | quote/base | price or level; exact definition in common field dictionary |

### Schema S011

First used by: ETHUSDT raw.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `data` | object | container | nested record/array; child fields and tuple meanings define contents |
| `data.A` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.B` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.E` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.P` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.T` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.U` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.a` | array / integer / string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.a[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `data.a[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `data.ap` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.b` | array / string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.b[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `data.b[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `data.e` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.f` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.i` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.l` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.m` | boolean | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.nq` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o` | object | container | nested record/array; child fields and tuple meanings define contents |
| `data.o.S` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.T` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.X` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.ap` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.f` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.l` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.o` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.p` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.ps` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.q` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.s` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.st` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.o.z` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.openInterest` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.p` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.ps` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.pu` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.q` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.r` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.s` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.st` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.symbol` | string | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.time` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `data.u` | integer | stream-specific | see Binance raw variant dictionary; extra fields not consumed locally are not verified |
| `recv_ms` | integer | epoch ms | local receive time |
| `src` | string | label | source/transport/venue discriminator |
| `stream` | string | container/label | source stream payload/discriminator; raw variant table above |

### Schema S012

First used by: ETHUSDT events.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `avg_price` | number | quote/base | price or level; exact definition in common field dictionary |
| `bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `from` | number | not verified | not verified from inspected local source; unresolved |
| `kind` | string | label | event-specific classification/discriminator |
| `levels` | integer | count | observations/levels; see common dictionary |
| `liquidated` | string | label | event-specific classification/discriminator |
| `move_pct` | number | not verified | not verified from inspected local source; unresolved |
| `notional_5s` | integer | not verified | not verified from inspected local source; unresolved |
| `price` | number | quote/base | price or level; exact definition in common field dictionary |
| `qty` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `ratio` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `side` | string | label | event-specific classification/discriminator |
| `sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `to` | number | not verified | not verified from inspected local source; unresolved |
| `trades` | integer | count | observations/levels; see common dictionary |
| `type` | string | label | event-specific classification/discriminator |
| `volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `window_s` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S013

First used by: ETHUSDT live snapshot.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bars` | array | container | nested record/array; child fields and tuple meanings define contents |
| `bars[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `bars[].absorb_candle` | null / string | label | event-specific classification/discriminator |
| `bars[].big_max` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].big_max_side` | null / string | label | event-specific classification/discriminator |
| `bars[].book_imb` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].buy_imb` | number | count | observations/levels; see common dictionary |
| `bars[].close` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].cvd_session` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].d_oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].high` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].liq_long` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].liq_short` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].low` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].open` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_val` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].sell_imb` | number | count | observations/levels; see common dictionary |
| `bars[].sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].stack_buy` | number | count | observations/levels; see common dictionary |
| `bars[].stack_sell` | number | count | observations/levels; see common dictionary |
| `bars[].t_ms` | number | epoch ms | exchange-derived closed-bar start |
| `bars[].vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].vwap_sd` | number | quote/base | weighted deviation width or mark−index premium |
| `collector` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.backfilled` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.book.asks` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.bids` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.resyncs` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.state` | string | not verified | not verified from inspected local source; unresolved |
| `collector.data_dir` | string | not verified | not verified from inspected local source; unresolved |
| `collector.delay_ms` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.gaps` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.liquidations` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.started` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.trades` | integer | count | observations/levels; see common dictionary |
| `events` | array | container | nested record/array; child fields and tuple meanings define contents |
| `events[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `events[].avg_price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].from` | number | not verified | not verified from inspected local source; unresolved |
| `events[].kind` | string | label | event-specific classification/discriminator |
| `events[].levels` | integer | count | observations/levels; see common dictionary |
| `events[].liquidated` | string | label | event-specific classification/discriminator |
| `events[].price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].qty` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].ratio` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `events[].side` | string | label | event-specific classification/discriminator |
| `events[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].to` | number | not verified | not verified from inspected local source; unresolved |
| `events[].type` | string | label | event-specific classification/discriminator |
| `events[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `footprints` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].step` | number | quote/base | footprint price bin width |
| `footprints[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `generated` | integer | epoch ms | local snapshot generation time |
| `status` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar.bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.close` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.bar.vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `status.bar.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar_fp` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.step` | number | quote/base | footprint price bin width |
| `status.bar_fp.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.ask_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.best_ask` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.best_bid` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.bid_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.bid_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.imbalance` | number | not verified | not verified from inspected local source; unresolved |
| `status.last_price` | number | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.liq_5m.count` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.long` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.short` | integer | not verified | not verified from inspected local source; unresolved |
| `status.mark` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.mark.funding` | string | fraction | published funding rate, not percentage points |
| `status.mark.index` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.mark` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.next_funding` | integer | not verified | not verified from inspected local source; unresolved |
| `status.naked` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.naked[]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.prev_day` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.prev_day.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.session.cvd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.day` | string | UTC date | session/archive/origin day, not local receive time |
| `status.session.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.sd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.session.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.velocity` | number | not verified | not verified from inspected local source; unresolved |
| `tf` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S014

First used by: SOLUSDT live snapshot.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bars` | array | container | nested record/array; child fields and tuple meanings define contents |
| `bars[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `bars[].absorb_candle` | null / string | label | event-specific classification/discriminator |
| `bars[].big_max` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].big_max_side` | null / string | label | event-specific classification/discriminator |
| `bars[].book_imb` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].buy_imb` | number | count | observations/levels; see common dictionary |
| `bars[].close` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].cvd_session` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].d_oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].high` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].liq_long` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].liq_short` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].low` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].open` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].s_val` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].sell_imb` | number | count | observations/levels; see common dictionary |
| `bars[].sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].stack_buy` | number | count | observations/levels; see common dictionary |
| `bars[].stack_sell` | number | count | observations/levels; see common dictionary |
| `bars[].t_ms` | number | epoch ms | exchange-derived closed-bar start |
| `bars[].vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `bars[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `bars[].vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `bars[].vwap_sd` | number | quote/base | weighted deviation width or mark−index premium |
| `collector` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.backfilled` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `collector.book.asks` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.bids` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.resyncs` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.book.state` | string | not verified | not verified from inspected local source; unresolved |
| `collector.data_dir` | string | not verified | not verified from inspected local source; unresolved |
| `collector.delay_ms` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.gaps` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.liquidations` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.started` | integer | not verified | not verified from inspected local source; unresolved |
| `collector.trades` | integer | count | observations/levels; see common dictionary |
| `events` | array | container | nested record/array; child fields and tuple meanings define contents |
| `events[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `events[].avg_price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].from` | number | not verified | not verified from inspected local source; unresolved |
| `events[].levels` | integer | count | observations/levels; see common dictionary |
| `events[].liquidated` | string | label | event-specific classification/discriminator |
| `events[].price` | number | quote/base | price or level; exact definition in common field dictionary |
| `events[].qty` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].ratio` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `events[].side` | string | label | event-specific classification/discriminator |
| `events[].sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `events[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `events[].to` | number | not verified | not verified from inspected local source; unresolved |
| `events[].trades` | integer | count | observations/levels; see common dictionary |
| `events[].type` | string | label | event-specific classification/discriminator |
| `events[].volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `footprints` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `footprints[].step` | number | quote/base | footprint price bin width |
| `footprints[].t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `generated` | integer | epoch ms | local snapshot generation time |
| `status` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar.bought` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.close` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.delta` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.bar.sold` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.bar.vel_max` | number | ratio | normalized deviation/velocity/book imbalance; see common dictionary |
| `status.bar.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.bar_fp` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.lv[][]` | integer / number | container | nested record/array; child fields and tuple meanings define contents |
| `status.bar_fp.step` | number | quote/base | footprint price bin width |
| `status.bar_fp.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `status.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.ask_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.ask_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.best_ask` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.best_bid` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.book.bid_depth` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.book.bid_walls` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.bid_walls[][]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.book.imbalance` | number | not verified | not verified from inspected local source; unresolved |
| `status.last_price` | number | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.liq_5m.count` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.long` | integer | not verified | not verified from inspected local source; unresolved |
| `status.liq_5m.short` | integer | not verified | not verified from inspected local source; unresolved |
| `status.mark` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.mark.funding` | string | fraction | published funding rate, not percentage points |
| `status.mark.index` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.mark` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.mark.next_funding` | integer | not verified | not verified from inspected local source; unresolved |
| `status.naked` | array | container | nested record/array; child fields and tuple meanings define contents |
| `status.naked[]` | number | container | nested record/array; child fields and tuple meanings define contents |
| `status.oi` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.prev_day` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.prev_day.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.prev_day.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session` | object | container | nested record/array; child fields and tuple meanings define contents |
| `status.session.cvd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.day` | string | UTC date | session/archive/origin day, not local receive time |
| `status.session.high` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.low` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.open` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.poc` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.sd` | number | not verified | not verified from inspected local source; unresolved |
| `status.session.vah` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.val` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.session.volume` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `status.session.vwap` | number | quote/base | price or level; exact definition in common field dictionary |
| `status.velocity` | number | not verified | not verified from inspected local source; unresolved |
| `tf` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S015

First used by: Binance Vision research trades.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `agg_trade_id` | string | identifier | exchange aggregate/constituent trade ID |
| `first_trade_id` | string | identifier | exchange aggregate/constituent trade ID |
| `is_buyer_maker` | string | boolean text | true means seller aggressor |
| `last_trade_id` | string | identifier | exchange aggregate/constituent trade ID |
| `price` | string | quote/base | price or level; exact definition in common field dictionary |
| `quantity` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `transact_time` | string | epoch ms | exchange trade timestamp |

### Schema S016

First used by: Bybit public research trades.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `RPI` | string | not verified | not verified from inspected local source; unresolved |
| `foreignNotional` | string | not verified | not verified from inspected local source; unresolved |
| `grossValue` | string | not verified | not verified from inspected local source; unresolved |
| `homeNotional` | string | not verified | not verified from inspected local source; unresolved |
| `price` | string | quote/base | price or level; exact definition in common field dictionary |
| `side` | string | label | event-specific classification/discriminator |
| `size` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `tickDirection` | string | not verified | not verified from inspected local source; unresolved |
| `timestamp` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `trdMatchID` | string | not verified | not verified from inspected local source; unresolved |

### Schema S017

First used by: Bybit mark klines.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `close` | string | quote/base | price or level; exact definition in common field dictionary |
| `high` | string | quote/base | price or level; exact definition in common field dictionary |
| `low` | string | quote/base | price or level; exact definition in common field dictionary |
| `open` | string | quote/base | price or level; exact definition in common field dictionary |
| `start_ms` | string | epoch ms | exchange mark-candle start |

### Schema S018

First used by: Research download manifest.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bytes` | string | bytes | stored file size |
| `checksum_status` | string | label | verification result, not strategy input completeness |
| `date` | string | UTC date | session/archive/origin day, not local receive time |
| `file` | string | path | artifact path; not a connection identifier |
| `rows` | string | not verified | not verified from inspected local source; unresolved |
| `sha256` | string | hex digest | SHA-256 integrity/provenance hash |
| `source` | string | label | source/transport/venue discriminator |
| `symbol` | string | identifier | market symbol / coin; source-specific |

### Schema S019

First used by: Archive upload ledger.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `hour` | string | UTC hour | data partition |
| `kind` | string | label | event-specific classification/discriminator |
| `local_sha256` | string | hex digest | SHA-256 integrity/provenance hash |
| `remote_path` | string | path | artifact path; not a connection identifier |
| `remote_sha256` | string | hex digest | SHA-256 integrity/provenance hash |
| `size_bytes` | string | bytes | stored file size |
| `status` | string | container | nested state/records; common dictionary above |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `verified_at_utc` | string | UTC ISO time | local archive verification completion time |

### Schema S020

First used by: Disk alert state.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `last_free_pct` | number | not verified | not verified from inspected local source; unresolved |
| `last_path` | string | not verified | not verified from inspected local source; unresolved |
| `last_sent_at` | number | not verified | not verified from inspected local source; unresolved |
| `last_sent_iso` | string | not verified | not verified from inspected local source; unresolved |
| `last_threshold_pct` | number | not verified | not verified from inspected local source; unresolved |

### Schema S021

First used by: Daily data checks.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `first_aggTrade_id` | string | identifier | exchange aggregate/constituent trade ID |
| `hour` | string | UTC hour | data partition |
| `last_aggTrade_id` | string | identifier | exchange aggregate/constituent trade ID |
| `missing_id_count` | string | count | missing aggregate IDs according to check |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `tape_sha256` | string | hex digest | SHA-256 integrity/provenance hash |
| `trade_count` | string | count | observations/levels; see common dictionary |
| `verify` | string | label | verification result, not strategy input completeness |

### Schema S022

First used by: Evaluation alert-ledger.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `mark_logged` | string | not verified | not verified from inspected local source; unresolved |
| `price_feed` | string | not verified | not verified from inspected local source; unresolved |
| `process_start_utc` | string | not verified | not verified from inspected local source; unresolved |
| `side` | string | label | event-specific classification/discriminator |
| `sl_recon` | string | not verified | not verified from inspected local source; unresolved |
| `sl_sent` | string | not verified | not verified from inspected local source; unresolved |
| `source_id` | string | not verified | not verified from inspected local source; unresolved |
| `status` | string | container | nested state/records; common dictionary above |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `telegram_message_id` | string | not verified | not verified from inspected local source; unresolved |
| `text_source` | string | not verified | not verified from inspected local source; unresolved |
| `tp1_recon` | string | not verified | not verified from inspected local source; unresolved |
| `tp1_sent` | string | not verified | not verified from inspected local source; unresolved |
| `tp2_recon` | string | not verified | not verified from inspected local source; unresolved |
| `tp2_sent` | string | not verified | not verified from inspected local source; unresolved |
| `tp3_recon` | string | not verified | not verified from inspected local source; unresolved |
| `tp3_sent` | string | not verified | not verified from inspected local source; unresolved |
| `utc_time` | string | not verified | not verified from inspected local source; unresolved |
| `version` | string | not verified | not verified from inspected local source; unresolved |
| `version_proof` | string | not verified | not verified from inspected local source; unresolved |

### Schema S023

First used by: Evaluation alert-prices.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `binance_trade_price` | string | not verified | not verified from inspected local source; unresolved |
| `binance_vs_bybit_trade_bps` | string | not verified | not verified from inspected local source; unresolved |
| `bybit_trade_price` | string | not verified | not verified from inspected local source; unresolved |
| `bybit_trade_vs_mark_bps` | string | not verified | not verified from inspected local source; unresolved |
| `mark_logged` | string | not verified | not verified from inspected local source; unresolved |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `utc_time` | string | not verified | not verified from inspected local source; unresolved |

### Schema S024

First used by: Evaluation shadow-trades-a3a-run1.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `R` | string | not verified | not verified from inspected local source; unresolved |
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `covered_until` | string | not verified | not verified from inspected local source; unresolved |
| `dropped_tps` | string | not verified | not verified from inspected local source; unresolved |
| `entry_price` | string | not verified | not verified from inspected local source; unresolved |
| `entry_time` | string | not verified | not verified from inspected local source; unresolved |
| `exit_price` | string | not verified | not verified from inspected local source; unresolved |
| `exit_reason` | string | not verified | not verified from inspected local source; unresolved |
| `exit_time` | string | not verified | not verified from inspected local source; unresolved |
| `price_path` | string | not verified | not verified from inspected local source; unresolved |
| `risk_bps` | string | not verified | not verified from inspected local source; unresolved |
| `source_id` | string | not verified | not verified from inspected local source; unresolved |
| `tp_mode` | string | not verified | not verified from inspected local source; unresolved |
| `variant` | string | not verified | not verified from inspected local source; unresolved |
| `version` | string | not verified | not verified from inspected local source; unresolved |

### Schema S025

First used by: Evaluation short-candidates.jsonl.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `export_id` | integer | not verified | not verified from inspected local source; unresolved |
| `format` | string | not verified | not verified from inspected local source; unresolved |
| `price` | number | quote/base | price or level; exact definition in common field dictionary |
| `sl` | number | not verified | not verified from inspected local source; unresolved |
| `source_utc` | null / string | not verified | not verified from inspected local source; unresolved |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `telegram_local_exported` | string | not verified | not verified from inspected local source; unresolved |
| `telegram_utc` | string | not verified | not verified from inspected local source; unresolved |
| `text` | string | not verified | not verified from inspected local source; unresolved |
| `tp1` | number | not verified | not verified from inspected local source; unresolved |
| `tp2` | number | not verified | not verified from inspected local source; unresolved |
| `tp3` | number | not verified | not verified from inspected local source; unresolved |

### Schema S026

First used by: Evaluation short-watch-alerts.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `mark_at_alert` | string | not verified | not verified from inspected local source; unresolved |
| `missing` | string | not verified | not verified from inspected local source; unresolved |
| `sl` | string | not verified | not verified from inspected local source; unresolved |
| `source_log` | string | not verified | not verified from inspected local source; unresolved |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `telegram_message_id` | string | not verified | not verified from inspected local source; unresolved |
| `tp1` | string | not verified | not verified from inspected local source; unresolved |
| `tp2` | string | not verified | not verified from inspected local source; unresolved |
| `tp3` | string | not verified | not verified from inspected local source; unresolved |
| `utc_time` | string | not verified | not verified from inspected local source; unresolved |

### Schema S027

First used by: Evaluation v6-archive-sizes.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `bytes` | string | bytes | stored file size |
| `day` | string | UTC date | session/archive/origin day, not local receive time |
| `source` | string | label | source/transport/venue discriminator |
| `status` | string | container | nested state/records; common dictionary above |
| `symbol` | string | identifier | market symbol / coin; source-specific |

### Schema S028

First used by: Evaluation velocity-alerts.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `alert_price` | string | not verified | not verified from inspected local source; unresolved |
| `direction` | string | not verified | not verified from inspected local source; unresolved |
| `event_time_utc` | string | not verified | not verified from inspected local source; unresolved |
| `fade_direction` | string | not verified | not verified from inspected local source; unresolved |
| `plan_tradable` | string | not verified | not verified from inspected local source; unresolved |
| `review_finalized` | string | not verified | not verified from inspected local source; unresolved |
| `sl_pct` | string | not verified | not verified from inspected local source; unresolved |
| `source` | string | label | source/transport/venue discriminator |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `threshold_pct` | string | not verified | not verified from inspected local source; unresolved |
| `tp_pct` | string | not verified | not verified from inspected local source; unresolved |
| `trigger_label` | string | not verified | not verified from inspected local source; unresolved |
| `trigger_move_pct` | string | not verified | not verified from inspected local source; unresolved |
| `verdict` | string | not verified | not verified from inspected local source; unresolved |
| `volume_velocity_ratio` | string | not verified | not verified from inspected local source; unresolved |
| `window_ms` | string | not verified | not verified from inspected local source; unresolved |
| `worst_fill_price` | string | not verified | not verified from inspected local source; unresolved |

### Schema S029

First used by: Evaluation velocity-excursions-smoke.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `adv_ms_10` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_100` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_150` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_20` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_200` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_30` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_5` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_50` | string | not verified | not verified from inspected local source; unresolved |
| `adv_ms_75` | string | not verified | not verified from inspected local source; unresolved |
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `coverage_ok` | string | not verified | not verified from inspected local source; unresolved |
| `direction` | string | not verified | not verified from inspected local source; unresolved |
| `drift_10` | string | not verified | not verified from inspected local source; unresolved |
| `drift_120` | string | not verified | not verified from inspected local source; unresolved |
| `drift_1800` | string | not verified | not verified from inspected local source; unresolved |
| `drift_30` | string | not verified | not verified from inspected local source; unresolved |
| `drift_300` | string | not verified | not verified from inspected local source; unresolved |
| `drift_60` | string | not verified | not verified from inspected local source; unresolved |
| `drift_900` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_10` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_100` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_150` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_20` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_200` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_30` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_5` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_50` | string | not verified | not verified from inspected local source; unresolved |
| `fav_ms_75` | string | not verified | not verified from inspected local source; unresolved |
| `mae_10` | string | not verified | not verified from inspected local source; unresolved |
| `mae_120` | string | not verified | not verified from inspected local source; unresolved |
| `mae_1800` | string | not verified | not verified from inspected local source; unresolved |
| `mae_30` | string | not verified | not verified from inspected local source; unresolved |
| `mae_300` | string | not verified | not verified from inspected local source; unresolved |
| `mae_60` | string | not verified | not verified from inspected local source; unresolved |
| `mae_900` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_10` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_120` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_1800` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_30` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_300` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_60` | string | not verified | not verified from inspected local source; unresolved |
| `mfe_900` | string | not verified | not verified from inspected local source; unresolved |
| `n_trades_30m` | string | not verified | not verified from inspected local source; unresolved |
| `p0` | string | not verified | not verified from inspected local source; unresolved |
| `p0_time` | string | not verified | not verified from inspected local source; unresolved |
| `plan_tradable` | string | not verified | not verified from inspected local source; unresolved |
| `pre_range_1m` | string | not verified | not verified from inspected local source; unresolved |
| `pre_range_30m` | string | not verified | not verified from inspected local source; unresolved |
| `pre_range_5m` | string | not verified | not verified from inspected local source; unresolved |
| `pre_rv_5m` | string | not verified | not verified from inspected local source; unresolved |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `t0` | string | not verified | not verified from inspected local source; unresolved |

### Schema S030

First used by: Evaluation velocity-trades-smoke.csv.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `R` | string | not verified | not verified from inspected local source; unresolved |
| `alert_id` | string | not verified | not verified from inspected local source; unresolved |
| `alert_vs_path_bps` | string | not verified | not verified from inspected local source; unresolved |
| `direction` | string | not verified | not verified from inspected local source; unresolved |
| `entry_price` | string | not verified | not verified from inspected local source; unresolved |
| `entry_time` | string | not verified | not verified from inspected local source; unresolved |
| `exit_price` | string | not verified | not verified from inspected local source; unresolved |
| `exit_reason` | string | not verified | not verified from inspected local source; unresolved |
| `exit_time` | string | not verified | not verified from inspected local source; unresolved |
| `net_bps` | string | not verified | not verified from inspected local source; unresolved |
| `net_bps_maker` | string | not verified | not verified from inspected local source; unresolved |
| `plan_tradable` | string | not verified | not verified from inspected local source; unresolved |
| `price_path` | string | not verified | not verified from inspected local source; unresolved |
| `side` | string | label | event-specific classification/discriminator |
| `sl` | string | not verified | not verified from inspected local source; unresolved |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `tp` | string | not verified | not verified from inspected local source; unresolved |
| `variant` | string | not verified | not verified from inspected local source; unresolved |

### Schema S031

First used by: Watcher service-health-report.json.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `decision` | object | container | nested record/array; child fields and tuple meanings define contents |
| `decision.notifyTomas` | boolean | not verified | not verified from inspected local source; unresolved |
| `decision.reasons` | array | container | nested record/array; child fields and tuple meanings define contents |
| `decision.reasons[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `duplicateAlerts` | array | container | nested record/array; child fields and tuple meanings define contents |
| `generatedAt` | string | not verified | not verified from inspected local source; unresolved |
| `oomKills` | array | container | nested record/array; child fields and tuple meanings define contents |
| `orderflowContexts` | array | container | nested record/array; child fields and tuple meanings define contents |
| `orderflowContexts[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `orderflowContexts[].ageMs` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].available` | boolean | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].bars` | integer | container | nested state/records; common dictionary above |
| `orderflowContexts[].collector` | object | container | nested record/array; child fields and tuple meanings define contents |
| `orderflowContexts[].collector.backfilled` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.book` | object | container | nested record/array; child fields and tuple meanings define contents |
| `orderflowContexts[].collector.book.asks` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.book.bids` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.book.resyncs` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.book.state` | string | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.dataDir` | string | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.delayMs` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.gaps` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].collector.trades` | integer | count | observations/levels; see common dictionary |
| `orderflowContexts[].events` | integer | container | nested state/records; common dictionary above |
| `orderflowContexts[].generatedAt` | string | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].label` | string | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].lastPrice` | number | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].maxAgeMs` | integer | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].path` | string | path | artifact path; not a connection identifier |
| `orderflowContexts[].reason` | null | not verified | not verified from inspected local source; unresolved |
| `orderflowContexts[].velocity` | integer / number | not verified | not verified from inspected local source; unresolved |
| `services` | array | container | nested record/array; child fields and tuple meanings define contents |
| `services[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `services[].activeState` | string | not verified | not verified from inspected local source; unresolved |
| `services[].commandOk` | boolean | not verified | not verified from inspected local source; unresolved |
| `services[].mainPid` | integer | not verified | not verified from inspected local source; unresolved |
| `services[].memoryCurrentBytes` | integer | not verified | not verified from inspected local source; unresolved |
| `services[].nRestarts` | integer | not verified | not verified from inspected local source; unresolved |
| `services[].name` | string | not verified | not verified from inspected local source; unresolved |
| `services[].startedAt` | string | not verified | not verified from inspected local source; unresolved |
| `services[].stderr` | null | not verified | not verified from inspected local source; unresolved |
| `services[].subState` | string | not verified | not verified from inspected local source; unresolved |
| `since` | string | not verified | not verified from inspected local source; unresolved |
| `status` | string | container | nested state/records; common dictionary above |

### Schema S032

First used by: Watcher setup-analysis.json.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `alerts_without_finalized_review` | array | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].assetLabel` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].direction` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].hypothetical_trade_decision` | object | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].hypothetical_trade_decision.action` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].hypothetical_trade_decision.confidence` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].hypothetical_trade_decision.learning_tags` | array | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].hypothetical_trade_decision.learning_tags[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].hypothetical_trade_decision.thesis` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].hypothetical_trade_decision.trade_side` | null | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].hypothetical_trade_decision.why` | array | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].hypothetical_trade_decision.why[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `alerts_without_finalized_review[].id` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].recordedAt` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].triggerKind` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].triggerLabel` | string | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].triggerMovePct` | number | not verified | not verified from inspected local source; unresolved |
| `alerts_without_finalized_review[].trust_status` | string | not verified | not verified from inspected local source; unresolved |
| `call_line_decision` | object | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates` | array | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates[].key` | string | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].sample` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].suggested_call` | string | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trend_contexts` | object | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates[].trend_contexts.downtrend` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trend_contexts.flat` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trend_contexts.higher_timeframe_uptrend` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trend_contexts.mixed` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trigger_locations` | object | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates[].trigger_locations.down_impulse_into_near_support` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trigger_locations.lower_third` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trigger_locations.middle_third` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].trigger_locations.upper_third` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].verdicts` | object | container | nested record/array; child fields and tuple meanings define contents |
| `call_line_decision.candidates[].verdicts.fade` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.candidates[].verdicts.follow` | integer | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.live_alert_text_change` | boolean | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.reason` | string | not verified | not verified from inspected local source; unresolved |
| `call_line_decision.status` | string | container | nested state/records; common dictionary above |
| `candle_context` | object | container | nested record/array; child fields and tuple meanings define contents |
| `candle_context.cache` | string | not verified | not verified from inspected local source; unresolved |
| `candle_context.errors` | array | container | nested record/array; child fields and tuple meanings define contents |
| `candle_context.errors[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `candle_context.errors[].error` | string | not verified | not verified from inspected local source; unresolved |
| `candle_context.errors[].key` | string | not verified | not verified from inspected local source; unresolved |
| `candle_context.sources` | array | container | nested record/array; child fields and tuple meanings define contents |
| `candle_context.sources[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `generated_at` | string | not verified | not verified from inspected local source; unresolved |
| `parse_errors` | array | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules` | array | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules[].candle_context_ready` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].confidence` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].direction` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].dominant_bias` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].key` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].live_alert_text_change` | boolean | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].recommendation_rule_delta` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].sample` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].setup_type` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].suggested_call` | null / string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts` | object | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules[].trend_contexts.downtrend` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.flat` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.higher_timeframe_downtrend` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.higher_timeframe_uptrend` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.mixed` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.unknown_without_candle_context` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trend_contexts.uptrend` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations` | object | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules[].trigger_locations.down_impulse_into_near_support` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations.lower_third` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations.middle_third` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations.unknown` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations.up_impulse_into_near_resistance` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_locations.upper_third` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].trigger_quality` | string | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].verdicts` | object | container | nested record/array; child fields and tuple meanings define contents |
| `recommendation_rules[].verdicts.fade` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].verdicts.follow` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].verdicts.noisy` | integer | not verified | not verified from inspected local source; unresolved |
| `recommendation_rules[].verdicts.unclassified` | integer | not verified | not verified from inspected local source; unresolved |
| `schema_fields` | array | container | nested record/array; child fields and tuple meanings define contents |
| `schema_fields[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `scope` | string | not verified | not verified from inspected local source; unresolved |
| `setups` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].alert_time` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].asset` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].confidence` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].context.alert_candle_time` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.candle_error` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.candle_samples` | integer | not verified | not verified from inspected local source; unresolved |
| `setups[].context.data_scope` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.impulse` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.moves` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].context.moves.15m_pct` | number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.moves.240m_pct` | number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.moves.60m_pct` | number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.range` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].context.support_resistance.lookback_minutes` | integer | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.near_resistance` | boolean | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.near_support` | boolean | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.prior_high` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.prior_low` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.range_position` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.resistance_distance_pct` | number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.support_distance_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].context.support_resistance.trigger_location` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.trend` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].context.venue` | string | label | source/transport/venue discriminator |
| `setups[].direction` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].entry_quality` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].fade_vs_follow` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].hypothetical_trade_decision` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].hypothetical_trade_decision.action` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].hypothetical_trade_decision.confidence` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].hypothetical_trade_decision.learning_tags` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].hypothetical_trade_decision.learning_tags[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].hypothetical_trade_decision.thesis` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].hypothetical_trade_decision.trade_side` | null / string | not verified | not verified from inspected local source; unresolved |
| `setups[].hypothetical_trade_decision.why` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].hypothetical_trade_decision.why[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].id` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].mfe_mae.fade_1h_pct` | null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae.fade_30m_pct` | null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae.fade_mae_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae.fade_mfe_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae.follow_mae_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].mfe_mae.follow_mfe_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].recommendation_rule_delta` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].recommendation_rule_delta.action` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].recommendation_rule_delta.note` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].recommendation_rule_delta.status` | string | container | nested state/records; common dictionary above |
| `setups[].recorded_at` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].setup_type` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].source` | string | label | source/transport/venue discriminator |
| `setups[].symbol` | string | identifier | market symbol / coin; source-specific |
| `setups[].trigger` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].trigger.kind` | string | label | event-specific classification/discriminator |
| `setups[].trigger.label` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger.move_pct` | integer / number | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger.recent_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger.volume_velocity_ratio` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger_quality` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].trigger_quality.bucket` | string | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger_quality.maxScore` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger_quality.score` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].trigger_quality.tags` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].trigger_quality.tags[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.blockers` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.blockers[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.features` | object | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.features.aggressive_buy_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.aggressive_sell_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.book_fresh` | boolean / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.book_imbalance` | null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.cvd_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.cvd_pct_of_volume` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.spread_pct` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.top5_depth_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.features.trade_flow_notional` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.max_score` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].volume_orderflow.reasons` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.reasons[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].volume_orderflow.score` | integer / null | not verified | not verified from inspected local source; unresolved |
| `setups[].winner_loser_reason_tags` | array | container | nested record/array; child fields and tuple meanings define contents |
| `setups[].winner_loser_reason_tags[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `source` | string | label | source/transport/venue discriminator |
| `summary` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_asset` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_asset.BTC` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_asset.ETH` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_asset.HYPE` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_asset.SOL` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_hypothetical_action.consider_fade_with_confirmation` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action.consider_follow_after_confirmation` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action.observe_only` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action.skip_no_edge` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action.skip_until_review_finalized` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_hypothetical_action.skip_untrusted_delivery` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_range_context` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_range_context.compressed_range` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_range_context.expanded_range` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_range_context.normal_range` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_range_context.unknown_without_candle_context` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_setup_type` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_setup_type.velocity-shock-15m` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_setup_type.velocity-shock-5m` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_setup_type.velocity-shock-60s` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_setup_type.wick-shock` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_trend_context.downtrend` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.flat` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.higher_timeframe_downtrend` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.higher_timeframe_uptrend` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.mixed` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.unknown_without_candle_context` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trend_context.uptrend` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trigger_quality` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_trigger_quality.evidence-high` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trigger_quality.evidence-low` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trigger_quality.evidence-medium` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_trigger_quality.evidence-unscored` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_verdict` | object | container | nested record/array; child fields and tuple meanings define contents |
| `summary.by_verdict.fade` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_verdict.follow` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_verdict.noisy` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.by_verdict.unclassified` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.candle_context_ready` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.reviewed_setups` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.total_alert_decisions` | integer | not verified | not verified from inspected local source; unresolved |
| `summary.unreviewed_alerts` | integer | not verified | not verified from inspected local source; unresolved |
| `version` | integer | not verified | not verified from inspected local source; unresolved |

### Schema S033

First used by: Watcher setup-candle-context-cache.json.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `<cache-key>` | object | container | nested record/array; child fields and tuple meanings define contents |
| `<cache-key>.candles` | array | container | nested record/array; child fields and tuple meanings define contents |
| `<cache-key>.candles[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `<cache-key>.candles[].close` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `<cache-key>.candles[].high` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `<cache-key>.candles[].low` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `<cache-key>.candles[].open` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `<cache-key>.candles[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `<cache-key>.candles[].volume` | integer / number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `<cache-key>.coin` | null / string | identifier | market symbol / coin; source-specific |
| `<cache-key>.endMs` | integer | not verified | not verified from inspected local source; unresolved |
| `<cache-key>.error` | string | not verified | not verified from inspected local source; unresolved |
| `<cache-key>.fetchedAt` | string | not verified | not verified from inspected local source; unresolved |
| `<cache-key>.startMs` | integer | not verified | not verified from inspected local source; unresolved |
| `<cache-key>.symbol` | null / string | identifier | market symbol / coin; source-specific |
| `<cache-key>.venue` | string | label | source/transport/venue discriminator |

### Schema S034

First used by: Orderflow spike raw.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `ask` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `askQty` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `bid` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `bidQty` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `exchangeTs` | integer / null | epoch ms | exchange event time |
| `localReceiveTs` | integer | epoch ms | local receive time |
| `price` | integer / null / number | quote/base | price or level; exact definition in common field dictionary |
| `quantity` | integer / null / number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `raw` | object | container | nested record/array; child fields and tuple meanings define contents |
| `raw.A` | string | not verified | not verified from inspected local source; unresolved |
| `raw.B` | string | not verified | not verified from inspected local source; unresolved |
| `raw.E` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `raw.M` | boolean | not verified | not verified from inspected local source; unresolved |
| `raw.T` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `raw.a` | string | not verified | not verified from inspected local source; unresolved |
| `raw.asks` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.asks[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.asks[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `raw.b` | string | not verified | not verified from inspected local source; unresolved |
| `raw.bids` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.bids[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.bids[][]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `raw.coin` | string | identifier | market symbol / coin; source-specific |
| `raw.e` | string | not verified | not verified from inspected local source; unresolved |
| `raw.fast` | boolean | not verified | not verified from inspected local source; unresolved |
| `raw.hash` | string | not verified | not verified from inspected local source; unresolved |
| `raw.lastUpdateId` | integer | not verified | not verified from inspected local source; unresolved |
| `raw.levels` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.levels[]` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.levels[][]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `raw.levels[][].n` | integer | not verified | not verified from inspected local source; unresolved |
| `raw.levels[][].px` | string | not verified | not verified from inspected local source; unresolved |
| `raw.levels[][].sz` | string | not verified | not verified from inspected local source; unresolved |
| `raw.m` | boolean | not verified | not verified from inspected local source; unresolved |
| `raw.mid` | string | not verified | not verified from inspected local source; unresolved |
| `raw.p` | string | not verified | not verified from inspected local source; unresolved |
| `raw.px` | string | not verified | not verified from inspected local source; unresolved |
| `raw.q` | string | not verified | not verified from inspected local source; unresolved |
| `raw.s` | string | identifier | market symbol / coin; source-specific |
| `raw.side` | string | label | event-specific classification/discriminator |
| `raw.sz` | string | not verified | not verified from inspected local source; unresolved |
| `raw.t` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `raw.tid` | integer | not verified | not verified from inspected local source; unresolved |
| `raw.time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `raw.u` | integer | not verified | not verified from inspected local source; unresolved |
| `raw.users` | array | container | nested record/array; child fields and tuple meanings define contents |
| `raw.users[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `sequenceId` | null / string | not verified | not verified from inspected local source; unresolved |
| `side` | null / string | label | event-specific classification/discriminator |
| `source` | string | label | source/transport/venue discriminator |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `ts` | integer | not verified | not verified from inspected local source; unresolved |
| `type` | string | label | event-specific classification/discriminator |

### Schema S035

First used by: Orderflow spike features.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `avg_l1_imbalance` | string | not verified | not verified from inspected local source; unresolved |
| `avg_spread_bps` | string | not verified | not verified from inspected local source; unresolved |
| `book_updates` | string | not verified | not verified from inspected local source; unresolved |
| `bucket_iso` | string | not verified | not verified from inspected local source; unresolved |
| `bucket_seconds` | string | not verified | not verified from inspected local source; unresolved |
| `bucket_start_ms` | string | not verified | not verified from inspected local source; unresolved |
| `buy_taker_qty` | string | not verified | not verified from inspected local source; unresolved |
| `first_price` | string | not verified | not verified from inspected local source; unresolved |
| `last_price` | string | not verified | not verified from inspected local source; unresolved |
| `max_ask` | string | not verified | not verified from inspected local source; unresolved |
| `min_bid` | string | not verified | not verified from inspected local source; unresolved |
| `notional` | string | not verified | not verified from inspected local source; unresolved |
| `price_change_bps` | string | not verified | not verified from inspected local source; unresolved |
| `sell_taker_qty` | string | not verified | not verified from inspected local source; unresolved |
| `signed_qty` | string | not verified | not verified from inspected local source; unresolved |
| `source` | string | label | source/transport/venue discriminator |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `total_qty` | string | not verified | not verified from inspected local source; unresolved |
| `trade_count` | string | count | observations/levels; see common dictionary |
| `vwap` | string | quote/base | price or level; exact definition in common field dictionary |

### Schema S036

First used by: repo cache btc-eth-alert-edge/binance-archive-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `column_1` | string | not verified | not verified from inspected local source; unresolved |
| `column_10` | string | not verified | not verified from inspected local source; unresolved |
| `column_11` | string | not verified | not verified from inspected local source; unresolved |
| `column_12` | string | not verified | not verified from inspected local source; unresolved |
| `column_2` | string | not verified | not verified from inspected local source; unresolved |
| `column_3` | string | base units | ATAS tape aggressive sell / aggressive buy quantity, respectively |
| `column_4` | string | constant | ATAS tape reserved zero |
| `column_5` | string | base units | ATAS tape aggressive sell / aggressive buy quantity, respectively |
| `column_6` | string | not verified | not verified from inspected local source; unresolved |
| `column_7` | string | not verified | not verified from inspected local source; unresolved |
| `column_8` | string | not verified | not verified from inspected local source; unresolved |
| `column_9` | string | not verified | not verified from inspected local source; unresolved |

### Schema S037

First used by: repo btc-eth-alert-edge paper.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `precisionRepair` | object | container | nested record/array; child fields and tuple meanings define contents |
| `precisionRepair.afterBadRisk` | integer | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.beforeBadRisk` | integer | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.boundaries` | array | container | nested record/array; child fields and tuple meanings define contents |
| `precisionRepair.boundaries[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `precisionRepair.priceDigits` | integer | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.repaired` | integer | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.repairedAt` | string | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.skipped` | integer | not verified | not verified from inspected local source; unresolved |
| `precisionRepair.status` | string | container | nested state/records; common dictionary above |
| `signals` | array | container | nested record/array; child fields and tuple meanings define contents |
| `signals[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `signals[].close` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `signals[].closedAt` | integer | not verified | not verified from inspected local source; unresolved |
| `signals[].direction` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].entry` | integer / number | not verified | not verified from inspected local source; unresolved |
| `signals[].exitReason` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].id` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].maxBars` | integer | not verified | not verified from inspected local source; unresolved |
| `signals[].openedAt` | integer | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair` | object | container | nested record/array; child fields and tuple meanings define contents |
| `signals[].precisionRepair.atr14` | number | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.original` | object | container | nested record/array; child fields and tuple meanings define contents |
| `signals[].precisionRepair.original.entry` | number | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.original.stop` | number | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.original.target` | number | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.priceDigits` | integer | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.repairedAt` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.sourceFile` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].precisionRepair.status` | string | container | nested state/records; common dictionary above |
| `signals[].productId` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].regime` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].resultR` | integer / null / number | not verified | not verified from inspected local source; unresolved |
| `signals[].setup` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].source` | string | label | source/transport/venue discriminator |
| `signals[].status` | string | container | nested state/records; common dictionary above |
| `signals[].stop` | integer / number | not verified | not verified from inspected local source; unresolved |
| `signals[].symbol` | string | identifier | market symbol / coin; source-specific |
| `signals[].target` | integer / number | not verified | not verified from inspected local source; unresolved |
| `signals[].tier` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].timeframe` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].trend` | string | not verified | not verified from inspected local source; unresolved |
| `signals[].volatility` | string | not verified | not verified from inspected local source; unresolved |
| `updated` | string | not verified | not verified from inspected local source; unresolved |

### Schema S038

First used by: repo liquidation-q1-baseline-kill-switch results.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `config` | object | container | nested record/array; child fields and tuple meanings define contents |
| `config.baselineMovePct` | number | not verified | not verified from inspected local source; unresolved |
| `config.cascadeWindowMinutes` | integer | not verified | not verified from inspected local source; unresolved |
| `config.cooldownCandles` | integer | not verified | not verified from inspected local source; unresolved |
| `config.drawdownLookbackCandles` | integer | not verified | not verified from inspected local source; unresolved |
| `config.drawdownPct` | number | not verified | not verified from inspected local source; unresolved |
| `config.entryDelayCandles` | integer | not verified | not verified from inspected local source; unresolved |
| `config.entryLookaheadCandles` | integer | not verified | not verified from inspected local source; unresolved |
| `config.feeBpsPerSide` | number | not verified | not verified from inspected local source; unresolved |
| `config.holdCandles` | integer | not verified | not verified from inspected local source; unresolved |
| `config.holdoutFraction` | number | not verified | not verified from inspected local source; unresolved |
| `config.maxTail5Pct` | number | not verified | not verified from inspected local source; unresolved |
| `config.maxVolProxyCorrelation` | number | not verified | not verified from inspected local source; unresolved |
| `config.maxWorstClusteredDayReturn` | number | not verified | not verified from inspected local source; unresolved |
| `config.maxWorstTradePct` | number | not verified | not verified from inspected local source; unresolved |
| `config.minEdgeBps` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minHoldoutTrades` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minLiquidationNotionalMultiple` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minLiquidationNotionalUsd` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minReturnWithoutTopOutliers` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minRiskAdjustedEdge` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minSameDirectionEvents` | integer | not verified | not verified from inspected local source; unresolved |
| `config.minVolProxyObservations` | integer | not verified | not verified from inspected local source; unresolved |
| `config.partialFillFullDepthPct` | number | not verified | not verified from inspected local source; unresolved |
| `config.passiveLimitOffsetPct` | number | not verified | not verified from inspected local source; unresolved |
| `config.rollingLiquidationLookbackWindows` | integer | not verified | not verified from inspected local source; unresolved |
| `config.slippageBpsPerSide` | number | not verified | not verified from inspected local source; unresolved |
| `config.stopLossPct` | number | not verified | not verified from inspected local source; unresolved |
| `config.takeProfitPct` | number | not verified | not verified from inspected local source; unresolved |
| `config.topOutlierCount` | integer | not verified | not verified from inspected local source; unresolved |
| `diagnostics` | object | container | nested record/array; child fields and tuple meanings define contents |
| `diagnostics.crossAssetCascadeClustering` | object | container | nested record/array; child fields and tuple meanings define contents |
| `diagnostics.crossAssetCascadeClustering.clusteredShare` | number | not verified | not verified from inspected local source; unresolved |
| `diagnostics.crossAssetCascadeClustering.evaluated` | boolean | not verified | not verified from inspected local source; unresolved |
| `diagnostics.crossAssetCascadeClustering.symbols` | array | container | nested record/array; child fields and tuple meanings define contents |
| `diagnostics.crossAssetCascadeClustering.symbols[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `diagnostics.volatilityProxyCorrelation` | number | not verified | not verified from inspected local source; unresolved |
| `generatedAt` | string | not verified | not verified from inspected local source; unresolved |
| `input` | object | container | nested record/array; child fields and tuple meanings define contents |
| `input.candleCount` | integer | not verified | not verified from inspected local source; unresolved |
| `input.firstCandle` | string | not verified | not verified from inspected local source; unresolved |
| `input.lastCandle` | string | not verified | not verified from inspected local source; unresolved |
| `input.liquidationCount` | integer | not verified | not verified from inspected local source; unresolved |
| `input.symbols` | array | container | nested record/array; child fields and tuple meanings define contents |
| `input.symbols[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `signalCounts` | object | container | nested record/array; child fields and tuple meanings define contents |
| `signalCounts.drawdownReversal` | integer | not verified | not verified from inspected local source; unresolved |
| `signalCounts.largeCandleReversal` | integer | not verified | not verified from inspected local source; unresolved |
| `signalCounts.liquidationCascade` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.clusteredDaysPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.clusteredDaysPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.clusteredDaysPreview[].day` | string | UTC date | session/archive/origin day, not local receive time |
| `strategies.drawdownReversal.clusteredDaysPreview[].fills` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.clusteredDaysPreview[].opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.clusteredDaysPreview[].return` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.clusteredDaysPreview[].symbols` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.clusteredDaysPreview[].symbols[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.exitReasons` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.exitReasons.missed` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.exitReasons.stop` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.exitReasons.time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `strategies.drawdownReversal.fillRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.meanFilledReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.meanReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.medianReturn` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.riskAdjustedScore` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.sharpeLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.sortinoLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tail5PctReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.totalReturnApprox` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.totalReturnWithoutTopOutliers` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.trades` | integer | count | observations/levels; see common dictionary |
| `strategies.drawdownReversal.tradesPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.tradesPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.drawdownReversal.tradesPreview[].entry` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].entryTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].eventCount` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].exit` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].exitTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].fillFraction` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].filled` | boolean | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].grossReturn` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].limitPrice` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].netReturn` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].notionalUsd` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].reason` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].relativeThresholdUsd` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].side` | string | label | event-specific classification/discriminator |
| `strategies.drawdownReversal.tradesPreview[].signalTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].strategy` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.tradesPreview[].symbol` | string | identifier | market symbol / coin; source-specific |
| `strategies.drawdownReversal.tradesPreview[].triggerMovePct` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.winRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.worstClusteredDayReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.drawdownReversal.worstReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.clusteredDaysPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.clusteredDaysPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.clusteredDaysPreview[].day` | string | UTC date | session/archive/origin day, not local receive time |
| `strategies.largeCandleReversal.clusteredDaysPreview[].fills` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.clusteredDaysPreview[].opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.clusteredDaysPreview[].return` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.clusteredDaysPreview[].symbols` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.clusteredDaysPreview[].symbols[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.exitReasons` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.exitReasons.missed` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.exitReasons.time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `strategies.largeCandleReversal.fillRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.meanFilledReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.meanReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.medianReturn` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.riskAdjustedScore` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.sharpeLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.sortinoLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tail5PctReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.totalReturnApprox` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.totalReturnWithoutTopOutliers` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.trades` | integer | count | observations/levels; see common dictionary |
| `strategies.largeCandleReversal.tradesPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.tradesPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.largeCandleReversal.tradesPreview[].entry` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].entryTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].eventCount` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].exit` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].exitTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].fillFraction` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].filled` | boolean | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].grossReturn` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].limitPrice` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].netReturn` | integer / number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].notionalUsd` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].reason` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].relativeThresholdUsd` | null | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].side` | string | label | event-specific classification/discriminator |
| `strategies.largeCandleReversal.tradesPreview[].signalTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].strategy` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.tradesPreview[].symbol` | string | identifier | market symbol / coin; source-specific |
| `strategies.largeCandleReversal.tradesPreview[].triggerMovePct` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.winRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.worstClusteredDayReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.largeCandleReversal.worstReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.clusteredDaysPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.clusteredDaysPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.clusteredDaysPreview[].day` | string | UTC date | session/archive/origin day, not local receive time |
| `strategies.liquidationCascade.clusteredDaysPreview[].fills` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.clusteredDaysPreview[].opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.clusteredDaysPreview[].return` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.clusteredDaysPreview[].symbols` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.clusteredDaysPreview[].symbols[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.exitReasons` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.exitReasons.missed` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.exitReasons.stop` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.exitReasons.time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `strategies.liquidationCascade.fillRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.meanFilledReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.meanReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.medianReturn` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.opportunities` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.riskAdjustedScore` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.sharpeLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.sortinoLike` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tail5PctReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.totalReturnApprox` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.totalReturnWithoutTopOutliers` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.trades` | integer | count | observations/levels; see common dictionary |
| `strategies.liquidationCascade.tradesPreview` | array | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.tradesPreview[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `strategies.liquidationCascade.tradesPreview[].eventCount` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].fillFraction` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].filled` | boolean | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].grossReturn` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].limitPrice` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].netReturn` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].notionalUsd` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].reason` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].relativeThresholdUsd` | integer | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].side` | string | label | event-specific classification/discriminator |
| `strategies.liquidationCascade.tradesPreview[].signalTime` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].strategy` | string | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.tradesPreview[].symbol` | string | identifier | market symbol / coin; source-specific |
| `strategies.liquidationCascade.tradesPreview[].triggerMovePct` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.winRate` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.worstClusteredDayReturn` | number | not verified | not verified from inspected local source; unresolved |
| `strategies.liquidationCascade.worstReturn` | number | not verified | not verified from inspected local source; unresolved |
| `verdict` | object | container | nested record/array; child fields and tuple meanings define contents |
| `verdict.bestBaselineMeanReturn` | number | not verified | not verified from inspected local source; unresolved |
| `verdict.bestBaselineRiskAdjusted` | number | not verified | not verified from inspected local source; unresolved |
| `verdict.blockers` | array | container | nested record/array; child fields and tuple meanings define contents |
| `verdict.blockers[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `verdict.decision` | string | not verified | not verified from inspected local source; unresolved |
| `verdict.edgeVsBestBaseline` | number | not verified | not verified from inspected local source; unresolved |
| `verdict.riskAdjustedEdgeVsBestBaseline` | number | not verified | not verified from inspected local source; unresolved |

### Schema S039

First used by: repo cache strategy-destruction-filter/market-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `candles` | array | container | nested record/array; child fields and tuple meanings define contents |
| `candles[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `candles[].close` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `candles[].high` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `candles[].low` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `candles[].open` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `candles[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `candles[].volume` | integer / number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `meta` | object | container | nested record/array; child fields and tuple meanings define contents |
| `meta.archiveFilesAttempted` | integer | not verified | not verified from inspected local source; unresolved |
| `meta.market` | string | not verified | not verified from inspected local source; unresolved |
| `meta.provider` | string | not verified | not verified from inspected local source; unresolved |
| `meta.restTailStart` | string | not verified | not verified from inspected local source; unresolved |
| `meta.source` | string | label | source/transport/venue discriminator |

### Schema S040

First used by: repo cache strategy-destruction-filter/market-cache/h2.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `close` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `high` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `low` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `open` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `volume` | integer / number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |

### Schema S041

First used by: workspace cache btc-eth-alert-edge/binance-usdm-archive-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `id` | string | not verified | not verified from inspected local source; unresolved |
| `is_buyer_maker` | string | boolean text | true means seller aggressor |
| `price` | string | quote/base | price or level; exact definition in common field dictionary |
| `qty` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `quote_qty` | string | not verified | not verified from inspected local source; unresolved |
| `time` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |

### Schema S042

First used by: workspace cache btc-eth-alert-edge/funding.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `fetchErrors` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fetchedAt` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.ADA` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.ADA[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.ADA[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.ADA[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.ADA[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.ADA[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.ADA[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.AVAX` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.AVAX[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.AVAX[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.AVAX[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.AVAX[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.AVAX[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.AVAX[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.BNB` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.BNB[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.BNB[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.BNB[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.BNB[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.BNB[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.BNB[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.BTC` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.BTC[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.BTC[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.BTC[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.BTC[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.BTC[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.BTC[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.DOGE` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.DOGE[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.DOGE[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.DOGE[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.DOGE[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.DOGE[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.DOGE[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.ETH` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.ETH[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.ETH[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.ETH[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.ETH[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.ETH[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.ETH[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.LINK` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.LINK[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.LINK[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.LINK[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.LINK[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.LINK[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.LINK[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.SOL` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.SOL[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.SOL[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.SOL[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.SOL[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.SOL[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.SOL[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `fundingByCoin.XRP` | array | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.XRP[]` | object | container | nested record/array; child fields and tuple meanings define contents |
| `fundingByCoin.XRP[].coin` | string | identifier | market symbol / coin; source-specific |
| `fundingByCoin.XRP[].fundingRate` | number | fraction | published funding rate, not percentage points |
| `fundingByCoin.XRP[].premium` | number | quote/base | weighted deviation width or mark−index premium |
| `fundingByCoin.XRP[].time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `fundingByCoin.XRP[].timeIso` | string | not verified | not verified from inspected local source; unresolved |
| `requests` | object | container | nested record/array; child fields and tuple meanings define contents |
| `requests.endTimeMs` | integer | not verified | not verified from inspected local source; unresolved |
| `requests.fundingHistoryCoins` | array | container | nested record/array; child fields and tuple meanings define contents |
| `requests.fundingHistoryCoins[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `requests.metaAndAssetCtxs` | boolean | not verified | not verified from inspected local source; unresolved |
| `requests.startTimeMs` | integer | not verified | not verified from inspected local source; unresolved |
| `source` | string | label | source/transport/venue discriminator |
| `totals` | object | container | nested record/array; child fields and tuple meanings define contents |
| `totals.availableCoins` | integer | not verified | not verified from inspected local source; unresolved |
| `totals.fetchErrors` | integer | not verified | not verified from inspected local source; unresolved |
| `totals.fundingRows` | integer | not verified | not verified from inspected local source; unresolved |
| `totals.requestedCoins` | integer | not verified | not verified from inspected local source; unresolved |
| `totals.unavailableCoins` | integer | not verified | not verified from inspected local source; unresolved |
| `unavailableCoins` | array | container | nested record/array; child fields and tuple meanings define contents |
| `window` | object | container | nested record/array; child fields and tuple meanings define contents |
| `window.endTime` | integer | not verified | not verified from inspected local source; unresolved |
| `window.endTimeIso` | string | not verified | not verified from inspected local source; unresolved |
| `window.startTime` | integer | not verified | not verified from inspected local source; unresolved |
| `window.startTimeIso` | string | not verified | not verified from inspected local source; unresolved |

### Schema S043

First used by: workspace cache copytrading-address-intake/..

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `address` | string | not verified | not verified from inspected local source; unresolved |
| `initialStatus` | string | not verified | not verified from inspected local source; unresolved |
| `source` | string | label | source/transport/venue discriminator |

### Schema S044

First used by: workspace cache liquidation-q1-baseline-kill-switch/major-2026-06.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `closed_pnl` | string | not verified | not verified from inspected local source; unresolved |
| `coin` | string | identifier | market symbol / coin; source-specific |
| `direction` | string | not verified | not verified from inspected local source; unresolved |
| `liquidated_user` | string | not verified | not verified from inspected local source; unresolved |
| `liquidator_user` | string | not verified | not verified from inspected local source; unresolved |
| `mark_price` | string | not verified | not verified from inspected local source; unresolved |
| `price` | string | quote/base | price or level; exact definition in common field dictionary |
| `side` | string | label | event-specific classification/discriminator |
| `size` | string | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `symbol` | string | identifier | market symbol / coin; source-specific |
| `timestamp` | string | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |
| `trade_id` | integer | not verified | not verified from inspected local source; unresolved |
| `tx_hash` | string | not verified | not verified from inspected local source; unresolved |

### Schema S045

First used by: workspace cache strategy-destruction-filter/aggtrades-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `buyerIsMaker` | boolean | not verified | not verified from inspected local source; unresolved |
| `id` | integer | not verified | not verified from inspected local source; unresolved |
| `notional` | integer / number | not verified | not verified from inspected local source; unresolved |
| `price` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `quantity` | integer / number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `takerSide` | string | not verified | not verified from inspected local source; unresolved |
| `time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |

### Schema S046

First used by: workspace cache strategy-destruction-filter/market-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `openInterest` | integer / number | not verified | not verified from inspected local source; unresolved |
| `time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |

### Schema S047

First used by: workspace cache strategy-destruction-filter/planned-level-aggtrades-cache.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `buyerIsMaker` | boolean | not verified | not verified from inspected local source; unresolved |
| `id` | integer | not verified | not verified from inspected local source; unresolved |
| `notional` | number | not verified | not verified from inspected local source; unresolved |
| `price` | integer / number | quote/base | price or level; exact definition in common field dictionary |
| `quantity` | number | base units | quantity/signed flow/depth; exact definition in common dictionary or producer |
| `takerSide` | string | not verified | not verified from inspected local source; unresolved |
| `time` | integer | not universal | clock is stream/dataset-specific; use time semantics above; no inferred receive-time equivalence |

### Schema S048

First used by: workspace volume-velocity-dex-discrepancy results.

| Field | Observed type | Unit | Meaning |
|---|---|---|---|
| `blockNumber` | integer | not verified | not verified from inspected local source; unresolved |
| `btcGate` | string | not verified | not verified from inspected local source; unresolved |
| `btcGateReason` | string | not verified | not verified from inspected local source; unresolved |
| `buckets` | object | container | nested record/array; child fields and tuple meanings define contents |
| `buckets.{}` | object | container | nested record/array; child fields and tuple meanings define contents |
| `buckets.{}.grossProfitUsd` | number | not verified | not verified from inspected local source; unresolved |
| `buyAmmType` | string | not verified | not verified from inspected local source; unresolved |
| `buyPool` | string | not verified | not verified from inspected local source; unresolved |
| `buyPriceSource` | string | not verified | not verified from inspected local source; unresolved |
| `buyStateBlock` | integer | not verified | not verified from inspected local source; unresolved |
| `buyStateLogIndex` | integer | not verified | not verified from inspected local source; unresolved |
| `buyVenue` | string | not verified | not verified from inspected local source; unresolved |
| `chain` | string | not verified | not verified from inspected local source; unresolved |
| `eventId` | string | not verified | not verified from inspected local source; unresolved |
| `evidenceTier` | string | not verified | not verified from inspected local source; unresolved |
| `executionMode` | string | not verified | not verified from inspected local source; unresolved |
| `grossProfitMethod` | string | not verified | not verified from inspected local source; unresolved |
| `logIndex` | integer | not verified | not verified from inspected local source; unresolved |
| `notionalUsd` | integer | not verified | not verified from inspected local source; unresolved |
| `observedAt` | string | not verified | not verified from inspected local source; unresolved |
| `pair` | string | not verified | not verified from inspected local source; unresolved |
| `sellAmmType` | string | not verified | not verified from inspected local source; unresolved |
| `sellPool` | string | not verified | not verified from inspected local source; unresolved |
| `sellPriceSource` | string | not verified | not verified from inspected local source; unresolved |
| `sellStateBlock` | integer | not verified | not verified from inspected local source; unresolved |
| `sellStateLogIndex` | integer | not verified | not verified from inspected local source; unresolved |
| `sellVenue` | string | not verified | not verified from inspected local source; unresolved |
| `source` | string | label | source/transport/venue discriminator |
| `stateQualityFlags` | array | container | nested record/array; child fields and tuple meanings define contents |
| `stateQualityFlags[]` | string | container | nested record/array; child fields and tuple meanings define contents |
| `status` | string | container | nested state/records; common dictionary above |
| `txHash` | null | not verified | not verified from inspected local source; unresolved |

## Unresolved

- Scope is the discovered market/research/operational families plus personal aggregates, not a forensic inventory of every package, OS file or arbitrary scratch directory. Additional unregistered scratch writers and generated binary stores may exist.
- Exact per-field semantics remain not verified wherever marked in the schema register. Older schema variants, full-history event-time extrema and continuity were not scanned. Closed-hour count does not prove coverage.
- SQLite databases, YAML/checksum/text/report/lock files have count/size metadata but their selected-file row schema/count is not implemented in the stdlib inventory; these are explicit catalog gaps, not silently treated as complete datasets.
- Some heterogeneous experiment result directories select a newest Markdown report; per-format sub-inventories and every result→runner edge remain unresolved.
- Remote `ralph/raw/`, `ralph/derived/`: deeper physical locations/file counts/row samples/oldest event time not verified under shallow-listing scope. Code establishes the layout only. Remote `ralph/_test/`: setup/connectivity test uploads are described by docs/storagebox.md, but exact upload command/writer remains not verified. Remote `research/`: exact writer not verified; archive_upload.py targets ralph/raw and ralph/derived, not this directory. No remote access was attempted in D1b.
- R2 whole-chain equality remains partial: five mirrors verified in the D1b manifest; five excluded scripts are explicitly listed there. Newly traced workspace normalize-replay-warehouse-rows.mjs is included in the equal-hash mirrors. Main deployed entrypoint equality is the earlier snapshot, not a new all-runtime hash audit.
- First inventory failed on a non-date cache filename fragment (ValueError: unconverted data remains: 27). One fix requires bounded numeric date tokens and falls back to mtime for invalid dates. Rerun outcome is recorded in Verification below.

D1b producer reconciliation (source writer mapping, not proof of historical invocation):

- Resolved writer/mover: D015, D016, D031, D032, D047, D048, D063, D064, D122, D129, D132, D133, D135, D140, D142.
- Selected-file writer or writer family resolved, whole heterogeneous directory or historical invocation still not verified: D121, D123, D124, D127, D128, D134, D137, D138, D139, D143, D144.
- Producer still not verified after code/unit/crontab/cron review: D075, D076, D077, D078, D079, D081, D082, D089, D091, D092, D093, D094, D095, D096, D136.
- Storage Box `_test/` exact uploader and `research/` writer: not verified.

Configured patterns with no physical files at inspection (not verified as existing datasets):

- D011: BTCUSDT offline bars.
- D012: BTCUSDT offline events.
- D013: BTCUSDT offline footprints.
- D014: BTCUSDT offline sessions.
- D015: BTCUSDT legacy rounded tapes.
- D016: BTCUSDT legacy rounded engine.
- D072: Raw deletion ledger.

## Verification

D1b (2026-10-18): six stdlib inventory regression tests passed under R6; five mirrored modules passed node --check without execution. Restricted structural reads of D102/D106/D109 had stable size/mtime; only schemas, counts and timestamps were retained. Five mirror byte-equality checks passed. 102 historical time-field candidate lines were narrowed using stored integer extrema; no full raw-data or outcome re-evaluation was performed. Services, schedules, research data and runtime source files were unchanged.

R6 inventory rerun emitted all 151 expected dataset records in manifest order with no error records, including the final personal category. The process handle expired during the conversation pause; its exit status was not retained, so completion is verified from the complete parseable output, not a claimed exit code. Synthetic R6 checks passed for bounded/invalid filename dates, numeric cache IDs, compact-day/UTC-hour partitions, plain/gzip/xz readers, nested schema/time ranges, unnamed tape columns, headerless ZIP CSV, privacy-only output, and mutable-file classification. No services or data were changed. Git delivery is reported separately after commit/rebase/push.

## What we can and cannot observe

| Observable | Status | Evidence / boundary |
|---|---|---|
| Taker side / delta | **have** | Four futures tapes/raw aggTrades, bars and footprints; m=true ⇒ seller aggressor. Grouped trades, not opening/closing intent; hourly delta vs session CVD differ |
| Order book depth | **partial** | Four raw diff streams + recovery snapshots (REST 1,000/side), sampled books top 100/side ~1 Hz; spot watcher top-5 and bounded spike captures. Sequence gaps and unseen far levels constrain replay |
| Liquidations | **partial** | forceOrder raw + derived liquidation events/bars, only latest per symbol per 1,000 ms; not complete executed-liquidation volume |
| Open interest | **partial** | Four-symbol REST OI polls ~10 s + request duration and derived bars; market aggregate, not participant positions or per-second gross openings |
| Funding | **have** | markPrice@1s publishes current funding rate/next funding time; bars retain latest rate. Not proof of historical payments or complete funding history |
| Longs vs shorts opened per second | **no** | Trade aggressor side and OI changes do not identify opening vs closing legs, account positions or gross directional openings |
| Liquidation heatmap | **no** | No exchange-wide leveraged position/liquidation-level map. Resting-order-book heat/depth and already published forceOrder events are not that dataset |
