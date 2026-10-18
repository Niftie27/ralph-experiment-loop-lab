# RALPH ledger

Every idea and thread with its status and next step. Nothing is deleted: finished, paused or invalidated items stay with their result or reason.
IDs never change; a new item gets the next free ID (decision 2026-10-18).
Updated: 2026-10-18 19:00Z (seed written by Claude from the chats and continuation prompts up to 2026-10-18; adds the L1a result and the 18:15Z cron report).

Standing rules for strategies (Tomas): the HTF trend is always the overarching context; the bigger picture comes mainly from the BTC daily and weekly trend; trends exist on every timeframe (weekly > daily > 4h > 1h ...). TA is always part of a strategy, never analyzed in isolation (I49). Entries are refined on lower timeframes; waiting for confirmation and catching the wick at the level are two different entry styles (I51). Claude records and revises everything Tomas says about strategies and TA, and keeps the data-gap list (I50) current.

Status legend: OPEN (with phase) · DONE (with result) · PAUSED (with reason) · DECIDED · INVALIDATED (with reason).
Related files: docs/state.md (what runs now), docs/decisions.md (why it is the way it is), docs/data-catalog.md (what data we have).

## Strategy and research

- **I01 Velocity alerts fade/follow** — INVALIDATED in-sample (V4/V5: all 128 TP/SL combinations negative, even at zero latency). Forward test OPEN: pre-registration 341d864, window 2026-10-14..2026-11-15, one evaluation after 2026-11-15, no interim looks. Next: the evaluation; afterwards re-enable ralph-state-of-edge-daily (I45).
- **I02 Short watchers (BTC/ZEC/HYPE on Bybit)** — evaluated A3b/A3c: all 96 variants negative (best −19.2 R); design flaws (BTC TP1 too close, HYPE SL very wide). Running unchanged by Tomas's decision. OPEN: redesign vs park (ties to I10).
- **I03 Speed as edge** — INVALIDATED for velocity alerts (V5). Kept only as earlier detection → I04.
- **I04 Burst detector** (windows 5–30 s, latency 0.3/1/5 s, pre-registered) — OPEN, spec not written; needs tick data (H4).
- **I05 Backtest harness ("vibe trading in the background")** — H1 dc420bf, H2 a59af2f, H3a 9e5bfd3 DONE. H3b (systemd timer for the run queue, failure alert, weekly summary; widen data to ETH/HYPE and 1h/15m) and H3c (daily AI cron adds hypotheses to the queue) OPEN = S4. PRIORITY (Tomas, 2026-10-18): the strategy factory comes right after L1, extended with I48 and I49; goal = hundreds to thousands of variants, filtered by a funnel (sieve → holdout → Nautilus → demo-sim).
- **I06 NautilusTrader** — adoption DONE (2.0.0rc6 pinned; 1.231.0 venv kept as reference). Integration as the realistic second stage OPEN; where it runs = decision S5.
- **I07 SOL 4h MA reclaim (+BTC gate)** — research pass, contaminated by holdout selection; part of idea C (I08).
- **I08 Harness ideas A/B/C** (17 passes of H3a: A breakout long in trend up + mid vol on SOL and BTC; B SOL volume breakout; C SOL MA reclaim) — holdout pre-registration OPEN, waiting for Tomas's OK. Proposal: exactly 3 holdout runs (A = 0291+0292 as one test, B = 0162, C = 0110), criteria written before (expectancy > 0 after costs, PF ≥ 1.15, baseline lift > 0, minimum trades), long/short and regime split. Note: the harness uses Binance SPOT 4h candles (I10).
- **I10 Who we listen to** — OPEN decision. Facts: our datasets = Binance USD-M futures (4 VPS collectors); v1 alerts = Binance spot + Hyperliquid; harness H2/H3a = Binance spot 4h (HYPE perpetual); alert-edge loop = Binance spot klines; short watchers + reactor = Bybit. v1 missed the 2026-10-08 futures liquidation cascade. v1 stays unchanged as baseline; new alerting = v2 on futures (I22).
- **I13 New chains within ~3 weeks of mainnet are less competitive** — hypothesis OPEN (do not limit ourselves to them).
- **I15 Jev / LAYA decision models** — researched (notes in the Obsidian wiki); optional harness filter variant; Jev early access = Tomas's decision. PAUSED.
- **I16 TradingAgents** — researched; research layer only, its backtest is not a trade simulator. PAUSED.
- **I22 v2 alerting on futures** — OPEN (ties to I10, plan step 3).
- **I26 Cluster search** (footprint volume clusters, delta, absorption; early RALPH concept, compared with ATAS X ~2026-10-07) — OPEN. The engine already computes cluster_hits and cluster events, but it was never tested as a strategy; needs tick data (H4).
- **I27 Framework research** (local Claude Code, 2026-10-14: NautilusTrader, hftbacktest, Freqtrade, Hummingbot + quants-lab, Jesse, vectorbt) — research DONE: NautilusTrader (+ hftbacktest for book/latency); Hummingbot later for market making/arbitrage; bloXroute is a DEX/MEV transaction network, not a backtester. OPEN: copy REPORT.md and FOLLOWUP.md from the PC (~/code/ralph/framework-research/) into docs/research/.
- **I28 Tardis.dev** (paid historical market data) — PAUSED. Plans about $350–$6,000 per month (per a CCXT comparison page, Sept 2026); the first day of each month is free without an API key (useful for occasional validation). Free alternatives first (I50). Earlier comparison with our data in chat VPS_1.
- **I29 Copytrading / wallet shadowing** — OPEN (idea). First test = Hyperliquid public API (free): top-N leaderboard wallets, download their fills, test whether following them with OUR latency and after costs has an edge; pre-registered, out-of-sample; watch leaderboard survivorship bias and market-maker wallets. Copin only as a reference. Earlier: Base wallet shadowing unproven (sequencer-constrained).
- **I30 BTC key levels / scenario map** — OPEN. Daily or on-demand BTC snapshot from our data: 2 levels above/below, RSI 1h/4h, recent delta, liquidations, OI change.
- **I48 Robust evaluation in every harness report** — OPEN, part of the factory (after L1, with H3b/H3c). Walk-forward (e.g. choose on 12 months, test on the next 3, roll), results split by market regime (trend up/down, range, volatility) and by HTF trend, a separate "last 6 months" column, and a pass bar that rises with the number of trials in the registry (more variants = more lucky winners).
- **I49 TA building blocks in the harness** — OPEN, part of the factory. From candles (fast, no tick data needed): fib, VWAP, volume profile (approximation), SFP / fakeouts / liquidity sweeps, market structure (swings), HTF trend, confluence score, psychological levels (round numbers), key levels (previous day/week highs and lows, weekly/monthly open, HTF support/resistance, naked POCs). Every value must use only data known at that moment (no lookahead; swings count only once confirmed). Needs tick data (H4): CVD, footprint, cluster search (I26).
- **I50 Data gaps** (keep current) — OPEN.
  (a) Exact volume profile, CVD and footprint for history: Binance Vision USD-M daily `trades` (every trade with side, free); the repo already has a downloader (experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs). Earlier decision: missing days not downloaded yet (1.62 GB) → needed for H4; store on the Storage Box.
  (b) Order book history: full L2 from our collectors only since 2026-10-08; Binance Vision `bookDepth` = coarse depth by % levels (downloader exists). FREE alternative found 2026-10-18: Bybit history-data page offers daily L2 order book (500 levels, ob500) and tick trades for spot and contracts (page behind Cloudflare → manual or semi-automated download; check history depth and file sizes when reopened). Bybit's book, not Binance's. Tardis (I28) only if no free option fits.
  (c) Open interest, long/short ratios, taker volume history: Binance Vision `metrics` dataset — not verified; our own OI polls only since 2026-10-08.
  (d) Liquidations: forceOrder is a sample (latest per symbol per second); history source not verified.
  (e) Intrabar fills for limit entries on 4h/1h strategies: need 1m klines (Binance Vision, free) or trades.
  (f) The harness uses Binance SPOT candles while our datasets are futures (I10); ETH/HYPE and 1h/15m snapshots missing.
- **I51 Entries, confirmation and multi-timeframe** — OPEN, part of the factory. Structure: weekly/daily context (BTC trend first) → 4h/1h setup at a key level → 15m/5m/1m entry. Entry styles as explicit variants: (1) limit at the level (catch the wick; fill only if price trades through it, partial misses counted), (2) confirmation: close back beyond the level on the trigger timeframe, SFP close, lower-timeframe break of structure after a sweep, or a held retest, (3) market at the next open. Compare per variant: fill rate, R per trade, missed moves. Needs intrabar data (I50 e). Extends H1 entryMode.
- **I52 Strategy classes, latency budgets, backtest vs live** — OPEN. Classes: HFT (sub-second; as few steps as possible between data and decision, compute inside the data process, ties to I12/I14), fast scalps (seconds; e.g. about $2 on $3,000 capital, several per day), intraday/swing (minutes to hours; candles are fine). Principle: slow work (levels, context, TA) is precomputed; only the trigger at a key level must be fast. Every class needs its own latency model and cost model in the backtest: $2 on $3,000 = 0.067 %, so round-trip costs (fees, spread, slippage, gas on a DEX) must be lower than that or the class cannot exist. Live must use the same computation as the backtest (parity).
- **I53 Data verification engine (cross-source)** — OPEN, backlog (after the factory unless data doubts block it). A separate process that listens to and compares several sources for the same symbols: our collectors, Binance REST, Binance Vision daily files, Bybit (ws + history-data), Tardis free first day of each month. Compare: missing or duplicate trades, price/size mismatches, latency (local receive time vs exchange time), order-book consistency after replay. Already in place: hourly/daily data-checks (aggTrade ID continuity, missing_id_count, tape re-derivation sha) and a latency measurement (BTC feed p50 ~0.12 s, 2026-10-16). Tardis free day = independent reference for book reconstruction and trade completeness; first day comparable with our VPS data: 2026-11-01. One free day per month is not enough for backtests (12 scattered days per year), but useful for validation and for order-book samples from past years.

## DEX / on-chain

- **I11 Cross-DEX / flashloan arbitrage on smaller chains** (Avalanche, Base, Arbitrum) — OPEN, after RALPH. Earlier Avalanche baseline: 0 positive after costs even with immediate execution; block lag 2–5 s on public RPC. Add: measure how many blocks a Joe vs other-DEX spread stays open (Goldsky free tier or our own RPC logs). Tomas will send his old Joe data (I25).
- **I12 Colocation with the chain's nodes/sequencer** — hypothesis OPEN; test = spread duration in blocks vs our reaction time (with I11).
- **I14 "Slowest HFT" on-chain = fast enough for the same or next block** — question OPEN (ties to I12).
- **I23 zela_oracle_read_path_benchmark rework to another provider** — PAUSED.
- **I24 Liquidation bot for black-swan moves** — PAUSED.
- **I25 Old collected data missing from project knowledge** (e.g. Joe/AVAX scripts) — OPEN, Tomas will send.

## Data and infrastructure

- **I09 Data catalog** — DONE: catalog a36e290, review 2026-10-17, gap fixes D1b a9b403e (schemas D102/D106/D109, producers, source mirror, MCP section, time-field fix). Remaining unknown producers: D075–D079, D081, D082, D089, D091–D096, D136, Storage Box _test/ and research/.
- **I33 Raw retention** — DONE 2026-10-18 (8ed0178): verified 7-day raw deletion on, first run deleted 174 hours / 1.89 GB. OPEN: confirm net disk growth (0.88 GB/day measured on the first night while low-volume days were deleted; expected ~0.3 GB/day from 2026-10-19).
- **I34 Schema for D102/D106/D109** — DONE (a9b403e); research data, schema only, no example rows (V6).
- **I35 Workspace scripts mirrored into the repo (R2)** — PARTIAL: 5 mirrored with equal sha256 (a9b403e). analyze-alert-setups.mjs and orderflow-spike.mjs were excluded only because the prompt said "host" (public API hosts are fine) → mirror them. a2b_history_proof.py, a2c_bybit_crosscheck.py, a2c_minute_basis_remaining.py contain hard-coded home paths → parametrize first.
- **I36 BorgBackup for project backups** — PAUSED (after disk cleanup).
- **I37 DuckDB/Parquet experiment registry** — PAUSED; the append-only JSONL registry is enough until tick data (H4).
- **I38 storage_maintenance re-hashes every raw file each hour** (~13 GB read per run, idle IO) — backlog, not urgent.
- **I44 Disk alert below 20 % free** (checked hourly, alert throttled to one per 6 h) — OPEN, decision later (threshold, cleanup D+F to the Storage Box, or shorter retention). 2026-10-18 18:03Z: 16.2 % free (13.0 GB).
- **I45 OpenClaw cron jobs** — 2026-10-18: enabled liquid-crypto-alert-edge-backtest, ralph-weekly-maintenance, ralph-adversarial-improvement-loop, ralph-autoresearch-loop; ralph-state-of-edge-daily disabled until after the V6 evaluation (its report shows aggregate shadow PnL incl. VELOCITY). Stay off: heartbeat-main and skill-collection-review-main (config), bybit-execution-reactor job (obsolete duplicate of the reactor process), RALPH ETH SOL Replay (obsolete one-shot), crypto-updates-urgent-watcher-beta (96 runs/day). crypto-updates-daily-digest-beta = Tomas's decision (runs in his main Telegram session). 18:15Z report: alert-edge 16:03Z ok, adversarial 17:30Z ok (I55), weekly-maintenance 16:00Z failed (I54), autoresearch has not run since re-enabling (next 2026-10-19 07:30Z). OPEN: watch Codex quota (alert-edge runs 6×/day); record jobs in automation/loop-registry.yaml (S3).
- **I46 Alert-edge candle loader** — fix DONE (36f1c12: REST tail pagination, unfinished candles dropped; tests 5/5). Scheduled run 2026-10-18 16:03Z finished ok (no message). OPEN: read that run's own freshness check; scheduler ok alone is not proof (the 08:03Z run was infrastructure-OK while its freshness check failed).
- **I47 No paper/demo-sim trades since 2026-10-16 17:42Z** — DONE: normal (19 alerts since then, 0 tradable, 0 watcher errors). Re-check only if no tradable alert appears for several days.
- **I54 ralph-weekly-maintenance fails its cron-health check** — OPEN. Run 2026-10-18 16:00Z failed: inside its isolated run the automation tools expose only its own job, so it cannot check the other jobs; it also flagged adversarial reports ~118 h old (that job ran again at 17:30Z). Next: read the OpenClaw docs on job-scoped automation access, then narrow the check or give it read access.
- **I55 Adversarial loop: 1 row in candidate_review (HIGH, 2026-10-18 17:30Z)** — OPEN decision. The row comes from outputs/state-of-edge-report.json, written by the state-of-edge job at 07:34Z before it was disabled (candidate_review = sample ≥ 50, expectancy ≥ 0.15, PF ≥ 1.25, baseline lift ≥ 0.1). The suggested decision memo includes shadow results → possible V6 interim look. Until decided: no memo and no look at the row; the finding repeats daily on the same stale report. The destruction filter has 0 survivors.
- **I56 RAM and swap pressure on the VPS** — OPEN. 2026-10-18 15:07Z: 898 MiB of 3.7 GiB RAM available, swap 1.8 of 2.0 GiB used (docs/state.md f). Next: read-only check of which processes hold the memory. Ties to S5.

## Agents, tools and process

- **I17 Hermes agent** — PAUSED; A/B test later = S8.
- **I18 Test one MCP per separate session** — OPEN (see I32).
- **I19 Binance MCP** — OpenClaw has no Binance MCP (only obsidian-vault-files, a9b403e). It was tested once in Claude Code: snapshots only, useless for orderflow; it was authorized with trading permissions on an empty sub-account. OPEN: check on the PC whether it is disconnected. Note: Binance as a data source is excellent; the MCP is only one weak access channel.
- **I20 Local orderflow-lab review** — merged into I31.
- **I21 TTS voice settings lost in the OpenClaw upgrade** — OPEN, restore only if Tomas wants (pre-copy of the old config exists on the VPS).
- **I31 Local orderflow-lab dashboard** (PC ~/code/orderflow-lab: footprint, VWAP, fib, MAs, FVGs, naked POCs, demo-sim champion/challenger) — PAUSED, do not delete. To record: what it does, how to start it. Its PC collector duplicates the VPS collectors → S6. Later option: point it at VPS/Storage Box data for visual review.
- **I32 Rule for every new tool** — read its docs first, then find out how to connect: MCP, official API/SDK, CLI, webhook, data export or another channel (updated 2026-10-18).
- **I39 Dune** — PAUSED (paid; free plan reportedly view-only; revisit only for a specific historical DEX question).
- **I40 Nansen / Arkham wallet labels** — PAUSED (verify Arkham pricing/API when I29 starts).
- **I41 Allium** — PAUSED (enterprise, overkill).
- **I42 GMGN** — PAUSED (memecoins out of scope).
- **I43 Dune/Allium/Goldsky vs Binance/ATAS X comparison** — DONE: never done before and not meaningful (on-chain DEX data vs CEX orderflow are different markets). ATAS X vs Binance was compared: Binance equal or more detailed.

## Stack (from the stack proposal 2026-10-17)

- **S1 Project memory in the repo** (ledger, decisions, state, data catalog; continuation prompts only point to them) — OPEN. L1a DONE df717c1 (docs/state.md, docs/decisions.md 13 seed + 5 found, ledger skeleton, README Start here). L1b = this seed copied verbatim into docs/ledger.md.
- **S2 Alerts independent of OpenClaw** (direct Telegram Bot API sendMessage with retry; check it does not collide with OpenClaw polling) — OPEN. Decision: switch v1 only after testing on side alerts.
- **S3 One registry of scheduled jobs** (automation/loop-registry.yaml checked against systemd timers, crontab and OpenClaw cron; deterministic → systemd, AI → OpenClaw cron with failure alert) — OPEN.
- **S4 Research automation** = H3b + H3c (I05) — OPEN.
- **S5 Nautilus as the realistic second stage** — OPEN decision: run on the PC or the VPS (VPS RAM is tight).
- **S6 One source of datasets** — OPEN decision: stop the PC collector or keep it as a backup.
- **S7 Claude Code instead of chat** — OPEN decision; no SSH from Claude Code to production, or read-only only.
- **S8 Hermes A/B test** — PAUSED until H3b/H3c run reproducibly (same data, same task, same harness; no production access).

## Glossary

- Ledger = this file: every idea/thread with status and next step.
- Decision log = docs/decisions.md: every decision with date, who, why, what it replaces.
- Data catalog = docs/data-catalog.md: what data we have, where, and what one row means.
- State = docs/state.md: what runs right now, updated after every change.
- Second brain = these files + the Obsidian wiki. Repo files are the source of truth; Obsidian holds human-readable notes and lessons.
