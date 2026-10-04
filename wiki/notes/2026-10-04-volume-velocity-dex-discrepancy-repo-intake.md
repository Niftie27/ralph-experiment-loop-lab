---
title: Volume Velocity DEX Discrepancy Repo Intake
date: 2026-10-04
status: intake
tags:
  - ralph
  - volume-velocity
  - dex-discrepancy
  - arbitrage
  - repo-intake
---

# Volume Velocity DEX Discrepancy Repo Intake

## Scope

Tomas asked whether sudden BTC/market volume velocity or sudden token pump periods create price discrepancies between at least two DEXes, how those discrepancies change within seconds, and what infrastructure speed is required. Ethereum, Solana, and cross-chain routes are out of scope for this lane because they are too competitive or not the target shape.

Route economics must include DEX fees, flashloan fee, slippage/price impact, gas/base fee, priority tip/bribe/bundle cost, failed tx/revert/simulation-error cost, stale quote/state drift, and MEV/searcher competition.

## Intake Sources

All code and archives were inspected outside this repo at `/home/coder/.openclaw/workspace/trading-bot-repo-intake/`.

### `Niftie27/arbitrage_bot`

- Runtime: Node.js, Hardhat, ethers v6-ish usage, Solidity contract.
- Current useful core: Mantle paper spread monitor comparing Merchant Moe Liquidity Book and Agni V3 pools; `chain-logger/` is the better reusable subsystem.
- Data sources: public Mantle RPC, quoter contracts, DEX factory/router/quoter addresses in JSON config.
- Useful pieces:
  - executable quoter-based round-trip logger, not mid-price spread analysis;
  - configurable notional sizes;
  - AMM-type abstraction for V2, V3, Algebra, Liquidity Book;
  - JSONL records with timestamp, block, chain, pair, direction, notional, gross/net spread, net USD;
  - kill/extend/promote criteria based on recurring executable spreads and persistence.
- Execution risk: root bot is monitoring/paper mode by config, but repo contains flashloan execution contract and Hardhat deployment path. Treat execution code as unsafe for direct import.
- Do not import wholesale. Reuse the `chain-logger` design and rewrite/adapt it into a measurement-only RALPH experiment.

### `Niftie27/Liquidity_watcher`

- Runtime: Python with `httpx` and SQLite.
- Purpose: GeckoTerminal new-pool scanner for Base and BSC with liquidity/volume filters.
- Data sources: GeckoTerminal v2 free API; scan APIs are configured for BscScan/BaseScan but placeholder in clean clone.
- Useful pieces:
  - volume/liquidity ratio filter;
  - durable SQLite schema for discovered pools and sentinel log;
  - free/no-key new-pool discovery pattern from GeckoTerminal;
  - rough structure for detecting token launch/pump periods.
- Limitations for this lane: it is new-pool discovery and wallet/audit oriented, not second-by-second cross-DEX discrepancy measurement.
- Do not import wholesale. Reuse the lightweight pool-discovery and liquidity/volume filter ideas.

### `liquidity_watcher` Telegram zip

- Runtime: Python with SQLite snapshot.
- Contents: scanner, early buyer extractor, auditor, logs, SQLite database.
- Snapshot inventory: 84 discovered tokens, 158 candidate wallets, 280 early-buyer events, 960 sentinel log rows.
- Useful pieces:
  - example corpus of discovered Base/BSC pools;
  - early-buyer extraction schema and recurring-buyer fields;
  - possible seed set for post-hoc event windows.
- Hazard: contains exposed API material in source/logs. Do not copy secrets, logs, or DB wholesale into RALPH.
- Do not import except as sanitized, derived counts/schema/lessons.

### `mev_bot` Telegram zip

- Runtime: Go, Rust, Docker Compose, NATS JetStream, PostgreSQL, Prometheus.
- Purpose: Base L2 low-budget MEV architecture with pending tx scraper, pair watcher, wallet-shadow strategy, simulation pool, bundler, relays.
- Data sources: RPC endpoints, GraphQL pair watcher, NATS, Postgres.
- Useful pieces:
  - RPC endpoint rotator and health-quarantine pattern;
  - streaming bus shape: raw events -> strategy/simulation -> execution order;
  - Postgres schema for raw pending tx, pair events, and bundle log;
  - Prometheus alert ideas: p95 latency, RPC health, sim latency, gas cap, bundle acceptance.
- Execution risk: includes bundler, relay modes, vault signer env, and actual `.env`. Keep this out of the survival lane except as architecture anti-patterns/observability ideas.
- Do not import execution/bundler code.

### `Niftie27/zela_oracle_read_path_benchmark`

- Runtime: Rust, Python analysis/orchestrator, CSV datasets.
- Purpose: Solana/Zela read-path benchmark vs Helius.
- Useful pieces:
  - disciplined latency methodology;
  - p50/p95/p99 reporting;
  - paired-run data collection and honest measurement-asymmetry notes;
  - explicit distinction between read latency, simulation, and write/inclusion latency.
- Market scope issue: Solana itself is out of scope for this lane, so this is methodology only.

## Survival-Lane Synthesis

Most promising path is not a trading bot. It is a seconds-level event study:

1. Detect market-wide or token-local volume velocity events.
2. During each event, sample executable round-trip quotes across two or more DEXes on lower-competition EVM chains.
3. Record quote latency, block number, pair, direction, notional, gross spread, full cost stack, and whether the spread persists across seconds/blocks.
4. Kill chains/pairs quickly when all executable quotes are negative after full costs.

The best reusable asset is `arbitrage_bot/chain-logger`, but it must be upgraded for Tomas's question:

- polling interval needs seconds/subseconds where RPC allows, plus block-triggered sampling;
- logs need quote-start/quote-end timestamps and per-DEX quote latency;
- full cost stack must include DEX fees, slippage/price impact, gas/base fee, priority tip/bribe/bundle cost proxy, flashloan fee if modeled, failed tx/simulation budget, stale quote drift, and MEV competition classification;
- event labels must include volume velocity source and BTC/market regime context;
- route output stays read-only until evidence supports execution research.

## Candidate Experiment

Build `volume_velocity_dex_discrepancy_event_study` as a measurement-only RALPH experiment:

- Inputs:
  - CEX BTC/market volume velocity trigger or DEX token-volume trigger.
  - Chain/pair/DEX config adapted from chain-logger.
  - GeckoTerminal pool discovery for candidate lower-competition pools.
- Output:
  - JSONL quote samples with millisecond timestamps.
  - Event summary per trigger: max gross spread, max net spread, persistence duration, quote latency distribution, stale/drift failures.
  - Kill/promote verdict per chain/pair.
- First target shape:
  - lower-competition EVM chain with at least two DEXes and structurally different AMM models;
  - same-chain only;
  - no private keys;
  - no bundle submission.

## Reassessment Before Building

After a second pass, the experiment should not be treated as the automatic next build. The plan is viable only as a narrow feasibility probe, not as "build the RALPH arb lane."

Reasons:

- The best repo asset, `arbitrage_bot/chain-logger`, is a useful executable-quote logger, but its playbook is a February 2026 hypothesis. Chain selection must be re-triaged with current DEX volume, DEX overlap, AMM diversity, and RPC access before using its chain priority list.
- The logger's current persistence logic is polling-based and approximates persistence by repeated observations, not by event-triggered same-block or sub-block state change. It is adequate for eliminating dead chains, not for proving execution-grade opportunity survival.
- The existing logger counts gas as a fixed USD haircut. Tomas's lane needs a fuller cost model: DEX fees, price impact, gas/base fee, priority tip or bribe, flashloan fee if modeled, failed simulation/revert budget, stale quote/state drift, and MEV/searcher competition.
- `Liquidity_watcher` finds fresh pools and high volume/liquidity ratios through GeckoTerminal, but it polls every 5 minutes and uses 24h volume. It cannot answer seconds-level discrepancy questions by itself.
- The MEV bot zip provides useful plumbing patterns, but its scraper uses pending-block polling and its pair watcher has a placeholder PairCreated loop. It is not a trustworthy edge engine. Keep its RPC rotator, schema, NATS shape, and Prometheus alerts as design references only.
- Zela contributes measurement discipline, not direct market scope.

Live no-key DefiLlama DEX snapshot checked on 2026-10-04 showed the old low-competition list is uneven:

- Avalanche: about `$101M` 24h DEX volume, enough for triage; multiple DEXes and AMM models still make it a reasonable first non-ETH/non-SOL candidate.
- Base: about `$671M` 24h DEX volume, clearly liquid but likely more competitive; useful as a high-activity measurement/control chain, not automatically a survival lane.
- Mantle: about `$15M` 24h DEX volume and existing repo-specific Agni/Merchant Moe code; worth a cheap niche check, but venue overlap and actual liquidity depth must be verified.
- Sonic, Linea, Scroll, and ZKsync Era were below the original playbook's `$5M/day` chain threshold in this snapshot, so they should not be first-pass targets unless a specific pair/venue pocket is found.

Better immediate plan:

1. Run a current chain/venue triage first, not the full event study.
2. Pick 1-2 candidate chains only if they pass: 24h DEX volume, at least two meaningful DEXes, overlapping pairs, different AMM models, accessible RPC/WebSocket, and realistic no-key/low-cost data access.
3. Start with a 24h executable-quote logger at conservative cadence as a kill test.
4. Only if that finds positive executable spreads, add volume-velocity triggers, finer timestamps, event/block subscriptions, and full stale-drift/cost modeling.

Alternative approaches that may dominate:

- Pair-first rather than chain-first: use live DEX volume data to find overlapping high-turnover pairs, then test only those pairs.
- Discovery-first: use GeckoTerminal/Birdeye-style pool discovery to identify sudden pump/new-pool windows, then measure cross-DEX quotes only when a token appears on multiple venues.
- Infrastructure-first: build a reusable latency/quote harness and benchmark RPC/provider speed before strategy research; this may reveal that public/no-key infra is too slow before any market edge is tested.
- Non-arb pivot: if executable quote tests are dead after a few chains, move back to slower RALPH lanes such as wallet/source discovery, orderflow alerts, or liquidation/funding-basis research.

## Keep Out

- Flashloan execution contracts from `arbitrage_bot`.
- `mev_bot` bundler/relay/vault-signer path.
- Any `.env`, keys, raw logs with keys, wallet-private material, or zip database dump.
- Ethereum/Solana market-specific continuation for this lane.

## Open Questions

- Which non-Ethereum/non-Solana chain currently has enough DEX volume and two structurally different DEXes to justify the first 24h measurement?
- Can public RPC support second-level quote sampling without paid endpoints, or do we need a verified low-cost endpoint?
- What live volume velocity source is accessible now without paid keys?
- What full-cost proxy should be used before any chain-specific transaction simulation exists?
