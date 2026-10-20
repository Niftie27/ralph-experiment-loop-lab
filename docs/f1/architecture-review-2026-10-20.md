# Architecture review before F1a-2 (2026-10-20)

Written by Claude (chat) for decision 2026-10-20 (14), read-only, at main `e4b36cb`. Measurements ran in a sandbox (Node v22.22.2, Python 3.12.3, numpy 2.4.4) on synthetic 1m bars with Vision-like decimals; real Binance files may compress and parse differently, and F1a-2 measures them. Anything not checked is marked "not verified".

## Summary

No rebuild is needed. Two things lock in with F1a-2 and must be decided now: the 1m storage format with its in-memory representation (F1), and the snapshot unit with the data identity root (F2). One language decision must come before F1d, not after F1: which runtime will run live strategies (F4). Before F1b, trials must start storing their return series (F5). Findings are ranked by "would force a rebuild later".

## Findings

### F1. 1m data format and in-memory representation (F1a-2, now)

Evidence:
- `freezeSeries` (src/h2-contract.mjs) builds one JS object per bar, one JSON string of the whole window and a frozen copy of every bar.
- Measured on 2,102,400 synthetic 1m bars (the research period): 7 columns (OHLCV + taker buy volume) gave a 251.8 MB JSON file, peak RSS 1,371 MiB, 6.3 s; 10 columns gave 402.3 MB, peak 1,916 MiB, 9.6 s. Both exceed the 1 GiB cgroup.
- `backtestVariant` (src/engine.mjs) calls `freezeSeries` on every backtest, so that cost would repeat for every variant.
- Columnar alternative, same bars as 7 float64 columns filled directly while parsing (no objects): 117.8 MB file, 41.5 MB gzip, peak 357 MiB including re-reading the file and gzipping it. numpy read the same bytes with `np.fromfile` and returned identical values.
- One symbol-month (44,640 bars) through `freezeSeries`: peak 102 MiB.

Recommendation: F1a-2 writes 1m snapshots in a small columnar format and does not use `freezeSeries`.
- File: canonical JSON header (schema version, instrument, period, window, column names, dtype per column, row count, first and last open time) padded to a multiple of 8 bytes, then each column as little-endian values, one column after another.
- SHA-256 over the uncompressed file bytes; gzip only for storage and transfer, never inside the hash (zlib output can differ between builds).
- Its own manifest (for example `results/manifest-f1-1m.json`); `results/manifest-h2.json` stays byte-identical.
- Reader: verifies the hash once per process, returns typed arrays, slices a time range by binary search on the time column. Rows stay sparse exactly as in the files; missing minutes are reported, never filled.
- Determinism: `Number("61006.2")` is correctly rounded by the language spec and float64 little-endian bytes are fixed, so PC (Node 24.10) and VPS (Node 24.22) produce the same bytes without depending on library versions.

Rejected options: Parquet/Arrow need npm packages (breaks the zero-dependency rule and adds a writer version to the determinism problem). Per-month JSON through `freezeSeries` works for storage but moves the problem: any consumer of four years would rebuild about 2.1 M objects (about 1.4 GB) in F1a-3 or F1e.

Cost: one new module with tests in F1a-2 (estimate 0.5-1 day extra). The F1e engine path must accept typed arrays, which F1e needs anyway. The 73 existing tests stay untouched.

### F2. Snapshot unit and identity root (F1a-2 manifest, F1a-3)

Evidence:
- Vision monthly files are calendar months, while research starts 2021-10-18, holdout starts 2025-10-17 and the 12/3/3 walk-forward test windows start on the 17th/18th. `windowFor` rejects any window that crosses a period.
- Registry rows store `manifestSha256`, the hash of the whole manifest file, which changes whenever any series is appended. A growing 1m manifest would make identical trials look different.

Recommendation:
- Unit = instrument × calendar month, split at period boundaries: 2021-10 starts at 10-18; 2025-10 splits into a research part (10-01 to 10-17) and a holdout part (10-17 to 11-01); 2026-10 comes from daily files up to 10-17 (exclusive).
- Each manifest entry is self-contained: instrument, period, window, row count, first and last open time, snapshot sha256, and every source file with the sha256 from its own CHECKSUM file.
- Every derived series (F1a-3 aggregates, later F1d blocks) is identified by the 1m snapshot hashes it read plus the hash of the code that derived it. From F1a-3/F1b on, registry rows reference these hashes, not the whole-manifest hash.

Cost: small now; later it would mean relinking every registry row.

### F3. The holdout seal is logical, not physical (F1a-2, then F1c)

Evidence: the 2025-10 monthly zip holds research and holdout minutes in one file, so the data cannot be separated by files. `cachedSeries` itself has no holdout guard; today it is safe only because its callers are research-only (`researchConfig` forces the exact research window, `backtestVariant` calls `guardHoldout`).

Recommendation: holdout parts use the same format but are listed under period `holdout`; the 1m reader refuses period `holdout` (always, until F1c replaces the refusal with the real guard), proven by a test. Zips stay as downloaded; they are inputs and never read by strategy code. Data after 2026-10-17 is not downloaded in F1a.

Cost: one guard and one test in F1a-2.

### F4. Language: what actually decides it (before F1d; F1b protocol)

Facts: tracked code is .mjs 1.41 MB vs .py 0.49 MB. The factory engine is Node with no dependencies and 73 tests (1,438 test lines). Live paths today: v1 alerts, short watchers, the Bybit reactor and alert-edge are Node; collectors and the orderflow engine are Python. NautilusTrader (Rust core, Python API) is planned as S5 with D6's purpose "parity with live code". Spec F1d: every block is one shared function used by the backtest and later by live code (I52). Why the VPS agent originally chose Node is not recorded.

Analysis: TA blocks, signals and fill rules must be written in the language of the future live runtime; otherwise every block exists twice and parity becomes a permanent test burden. Statistics (DSR, effective N, null campaigns) never run live, so their language is free.

Recommendation:
- (a) Keep Node for data, engine, blocks and fills. Nothing changes for F1a-2 ("Node built-ins only" stays).
- (b) Before F1d, Tomas decides the live runtime. Recommended: Node, the existing alert/paper/demo-sim path on the VPS; NautilusTrader then becomes an independent fill-realism check (the agreement test), and D6's wording changes from "parity with live code" to that. If live should be NautilusTrader, blocks belong in Python and the engine language reopens, so this must be settled before F1d.
- (c) F1b statistics: Node at runtime, with reference values generated once by a pinned Python script (numpy/scipy) and committed as test fixtures, which gives vetted numbers without runtime dependencies on the VPS. Alternative: a Python statistics layer reading the columnar files and trial return series (pinned venv on PC and VPS). Results across implementations differ in the last digits (the same 2.1 M values summed by numpy and by a JS loop: 127933879301.9 vs 127933879301.85275), so any cross-language comparison needs tolerances. A full Python port would rewrite about 11k lines of source plus tests (weeks) with no benefit for F1a.

Cost: (a) none; (b) one decision; (c) a small script and fixtures in F1b.

### F5. Trials must store their return series (before the F1b H3a rerun)

Evidence: the registry has 400 rows; each stores only `expectancyR`, `maxDrawdownR`, `profitFactor` and `trades` (no trade list, no daily returns). Spec F1b derives effective N from clustering the correlation of trials' daily returns, while raw N (919) includes trials that are not registry rows at all.

Recommendation: from F1b on, every trial writes a content-addressed daily equity return series (and its trade list) in the same columnar format, referenced by its registry row. The F1b protocol defines how the old trials without series enter effective N (conservative proposal: each counts as its own cluster, which can only raise the bar). Decide together with the trial key (I60).

Cost: small at the start of F1b. Rerunning old trials later is not reproducible (the engine hash has changed since they ran).

### F6. Backtest bars vs live bars (after F1a-2, before F1d)

Evidence: the factory will use Vision klines (taker buy volume as the delta proxy); live features come from collector `live_bars_60s` (bought/sold from our own aggTrades, files since 2026-10-08, data catalog D004). The two have never been compared. The overlap days 2026-10-08 to 2026-10-16 lie in the holdout period; later days lie in the sealed forward period.

Recommendation: a data-only comparison per minute (OHLCV, volume, bought vs taker buy volume; no signals, no returns) between Vision 1m klines and collector 60s bars on the overlap days. It is the cheapest strong evidence that a factory candidate sees the same inputs as live code (I52 parity, I53). It needs Tomas's explicit OK because the days sit in sealed periods, even though it reads prices, not strategy outcomes. New ledger item.

Cost: one small script.

### F7. Spec gaps (spec edits, no rebuild)

- Entry-style fees: a filled `limit_at_level` order is a maker fill (Binance USD-M regular maker 2 bps per the spec's own source) with adverse selection; confirmation styles pay taker 5 bps. The spec has one taker model; per-style fees must be defined before F1e.
- Funding: the source (Vision funding files or REST history) is not verified; F1a-4 checks it and fails closed like klines.
- Memory ceiling: not set; recommendation 512 MiB peak per process for F1a and F1e (half the cgroup), measured with `process.resourceUsage().maxRSS`.
- "Where it runs" still says F1a downloads on the VPS; update it to decision 2026-10-19 (develop and build on the PC, VPS re-downloads and compares sha256).
- Demo-sim and NautilusTrader specs come after F1 as planned; F4 (b) and F6 feed them. Factory jobs enter `automation/loop-registry.yaml` at F1f (S3).

### F8. Compute placement and memory

Evidence: VPS MemAvailable about 1.2 GiB after the 2026-10-20 restart vs the provisional floor of 1.5 GiB (I56), so a factory job would not start there today. PC WSL: 3.74 GiB RAM (2.31 available), 8 CPUs (I70).

Recommendation: no change now. Keep every factory script host-agnostic (no hosts or home paths, the same CLI on PC and VPS, measured peak in every report). The VPS re-download and compare runs one symbol-month at a time. F1f needs I56 solved or a decision to run nightly jobs on the PC; raise the WSL limit before F1e (I70).

### F9. Data policy: spot, futures, context

- F1a-2 stays futures only (D1, D2). The instrument-to-Vision-path mapping should be data (market `linear_perpetual` → `futures/um`, `spot` → `spot`), so adding spot or ETHBTC later is a config row, not new code.
- Spot history: zips are cheap to archive, but every spot backtest is a counted trial (D1) and live spot collectors would add RAM load (I56). Recommendation: no spot download in F1a; archive spot zips when a pre-registered comparison needs them. Binance announced microsecond timestamps in spot files from 2025 (not verified here); a spot loader must test for it.
- Context data: ETHBTC (Binance spot, on Vision) fits the same loader. BTC dominance and OTHERS/OTHERSBTC are market-cap indices (TradingView, CoinGecko); a free full-history source is not verified, and market caps get revised (supply estimates), which is a lookahead risk. They need their own identity (for example market `index`) and provenance. This belongs to F1d and needs a new ledger item.

### F10. Storage and backups

The downloaded zips plus code are the source of truth: every snapshot can be rebuilt from them, so the zips are what the Storage Box must keep. Estimated raw size: about 0.2 GB per symbol for five years at 10 float64 columns (six symbols about 1.2 GB, HYPE shorter); real sizes come from F1a-2. Manifests and the registry are in git, so GitHub backs them up. I36 (Borg) is not needed for factory data; the unbacked risk remains the OpenClaw workspace (about 21 GB), outside F1.

### F11. Process and single sources of truth

- The spec exists twice (repo and Claude doc copy). Recommendation: the repo is authoritative; the Claude doc is marked as a copy or retired.
- F1 agent rules live partly in the local `CLAUDE.md` (not tracked, not verified) and partly in `AGENTS.md`. Recommendation: move the F1 rules into a tracked file that `CLAUDE.md` points to, so Codex, Claude Code and the VPS agent read one text.
- After F1a-2 there will be two Vision downloaders: `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs` (265 lines) has no CHECKSUM verification. New ledger item: alert-edge switches to the verified loader or is marked legacy.
- The slowest link is the relay of grill-me answers (Claude Code → Tomas → chat → VPS agent → chat → Tomas → Claude Code); batch questions per round.

### What stays as it is

Node harness and engine, the append-only JSONL registry (I37 stays paused), content-addressed snapshots, Binance Vision as the only futures source, the PR review loop, PC development and VPS production.

## Decisions for Tomas (recommendation first)

1. 1m format: columnar binary as in F1 (recommended) / per-month JSON through `freezeSeries` / Parquet.
2. Live runtime, before F1d: Node (recommended) / NautilusTrader.
3. F1b statistics: Node with Python-generated reference fixtures (recommended) / a Python statistics layer.
4. Data-only comparison of Vision 1m vs collector 60s bars on sealed days: yes (recommended) / no.
5. Spot history: only with a pre-registered comparison (recommended) / download now.

## Defaults for the F1a-2 grill-me (unless Tomas objects)

- Snapshot unit: instrument × month, split at period boundaries (F2).
- Format and manifest: as in F1, separate 1m manifest.
- Columns: open_time, open, high, low, close, volume, quote_volume, count, taker_buy_volume, taker_buy_quote_volume. `ignore` dropped; `close_time` checked (open_time + 59,999 ms) and dropped. Reason: a column added later means a new snapshot identity.
- Memory ceiling: 512 MiB peak per process, measured.
- Holdout: the reader refuses period `holdout` until F1c, with a test (F3).
- Locations: zips in a gitignored directory mirroring the Vision path; snapshots uncompressed in a gitignored cache named by sha256; compression only for the Storage Box.
- CLI: separate steps download, verify, build and compare (the last one for the VPS run against the committed manifest); non-zero exit on any mismatch; no hosts or home paths.
