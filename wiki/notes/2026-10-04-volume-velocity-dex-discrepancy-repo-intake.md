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

## Backlog After Reassessment

Do not jump straight into an event-study build. Backlog each lane and work through them slowly.

### Current Main Problem

RALPH does not yet know whether this opportunity class fails because:

- no executable same-chain DEX discrepancy survives costs;
- public/no-key infrastructure is too slow or too stale to observe it;
- the current chain/pair universe is wrong;
- the cost model is missing a hidden killer;
- or the repo material is too incomplete to reuse safely.

That means the main problem is access and falsification design, not implementation.

### Backlog Items

1. **Repo-depth audit**
   - Status: pending.
   - Goal: read each repo enough to separate reusable ideas from broken/demo code.
   - Output: repo-by-repo evidence table, not another broad summary.
   - Scope: `chain-logger`, Mantle scripts, liquidity watcher scanner/extractor, MEV bot scraper/pairwatcher/rotator/sim/bundler boundaries.

2. **Zela replacement / infra access map**
   - Status: pending.
   - Goal: replace Zela as a live option with accessible current infrastructure.
   - Output: no-key/free/paid-later access map for RPC, WebSocket, archive RPC, simulation/fork, and low-latency quote collection.
   - Rule: classify unavailable/paid/keyed options as watch or needs-approval, not active.

3. **Chain and venue triage**
   - Status: pending.
   - Goal: update the stale February 2026 chain list with current DEX volume, DEX overlap, AMM diversity, and RPC availability.
   - Output: a small ranked list of 1-2 chains for a kill test, or a decision to skip.
   - Candidate shape from current snapshot: Avalanche and Base for measurement/control; Mantle for a cheap repo-specific niche check; do not prioritize thin chains without a concrete pair pocket.

4. **Pair-first overlap map**
   - Status: pending.
   - Goal: find pairs that trade on at least two meaningful DEX venues on the same chain.
   - Output: pair/DEX/notional config candidate list.
   - Reason: chain-level volume is too blunt; edge, if any, lives at pair/venue level.

5. **Full-cost model spec**
   - Status: pending.
   - Goal: define a strict cost stack before any result can be called positive.
   - Include: DEX fees, price impact/slippage, gas/base fee, priority tip/bribe/bundle proxy, flashloan fee if modeled, failed simulation/revert budget, stale quote drift, and MEV/searcher competition.

6. **E2E latency and stale-state harness**
   - Status: pending.
   - Goal: benchmark whether accessible infrastructure can observe, quote, simulate, and hypothetically submit before the edge decays.
   - Output: p50/p95/p99 timing for each step: event/read, DEX quote A, DEX quote B, route computation, simulation/fork call, and hypothetical submit path.
   - Also log: block number, block timestamp, local receive timestamp, quote start/end timestamps per venue, RPC/provider identity, stale block lag, quote error rate, and route drift after delay buckets.
   - This is the real Zela-successor measurement discipline: if Zela is unavailable, RALPH must measure its own read/quote/simulate/submit latency budget.

7. **Backtest persistence versus live execution timing**
   - Status: pending.
   - Goal: separate historical opportunity survival from real-time observability.
   - Backtest can answer: did an executable block-boundary discrepancy exist for 1 block, 2 blocks, N seconds/blocks, and after approximate costs?
   - Backtest cannot fully answer: would RALPH have read, quoted, simulated, submitted, and landed before the discrepancy disappeared?
   - Needed method: reconstruct block-level quotes from archive/indexed state, then pair with live latency measurements to test delay buckets like 0.5s, 1s, 2s, 5s, next block, and next 2 blocks.
   - Private node is not required for the first research stage, but public RPC, paid RPC, archive RPC, and possible self-hosted/private-node paths must be benchmarked before any execution-grade conclusion.

8. **Executable-spread kill test**
   - Status: blocked until items 2-7 produce a candidate.
   - Goal: run a conservative 24h executable quote logger on one chain/pair set.
   - Output: kill/extend/promote decision.
   - Rule: no private keys, no execution, no bundle submission.

9. **Volume-velocity trigger layer**
   - Status: later.
   - Goal: add market/leader/token-local volume velocity only after raw quote viability exists.
   - Reason: triggers do not matter if the route never survives normal executable costs.

10. **Discovery-first pump lane**
   - Status: watch.
   - Goal: use GeckoTerminal-style new-pool/pump discovery to trigger quote checks only when a token has multiple venues.
   - Risk: may be too noisy and too late because GeckoTerminal data is coarse.

11. **Pivot backlog**
    - Status: always available.
    - Options: wallet/source discovery, orderflow alerts, liquidation map, funding-basis research, slower patient-retail lanes.
    - Trigger: executable DEX-discrepancy kill tests fail across a few credible chain/pair candidates.

## Infra Budget Frame

Tomas's budget constraint is central: ideal infra might cost around `$1000/month`, but the practical ceiling is closer to `$300/month`, possibly less. The lane must therefore be evaluated as an event-driven, rare-window system, not a continuous high-frequency arbitrage stack.

Current working thesis:

- Market/leader impulse or volume-velocity events may temporarily move mid/small caps and create same-chain DEX discrepancies.
- BTC dominates global market beta and remains the primary regime gate, but it is not the only trigger.
- Ecosystem leaders can drive related tokens: SOL can move Solana ecosystem tokens, BNB can move BSC ecosystem tokens, AVAX can move Avalanche ecosystem tokens, MNT can move Mantle ecosystem tokens, and sector/theme leaders can move baskets.
- The target opportunity is lower-competition follower-token DEX dislocation after a leader/factor asset moves quickly.
- Trading only during strong factor-triggered windows lowers infra volume requirements, but it does not remove the need for fast reads, fast quotes, strict stale-state control, and full cost accounting.

## Factor Trigger Frame

Do not hardcode BTC as the only trigger, but do keep BTC first. Treat BTC as the dominant global regime gate, then evaluate ETH/majors, then ecosystem or sector leaders, then follower tokens, then DEX venue discrepancies.

```text
trigger_asset -> follower_universe -> DEX quote survival
```

Hierarchy:

1. **BTC global regime first**
   - Classify BTC as risk-on, risk-off, transition, or stale.
   - Check whether BTC is breaking out, breaking down, rejecting, or coiling near a regime-changing level.
   - This sets the market weather.
2. **ETH and majors second**
   - ETH confirmation or divergence changes the meaning of the BTC move.
   - BTC-only impulse, BTC+ETH impulse, and ETH-led impulse are different states.
3. **Ecosystem or sector leader third**
   - SOL, BNB, AVAX, MNT, ARB/OP, ENA/Ethena, Pendle/yield, AI/meme/perp-DEX leaders, etc.
   - These identify where the shock is concentrating.
4. **Follower token fourth**
   - Measure whether the smaller/lower-liquidity token lags, overreacts, or reprices unevenly.
5. **DEX venue discrepancy last**
   - Only after the factor chain makes sense should RALPH test whether DEX venues disagree long enough to survive latency and full costs.

Trigger classes:

- **Global beta:** BTC, ETH.
- **Ecosystem leader:** SOL for Solana ecosystem, BNB for BSC, AVAX for Avalanche, MNT for Mantle, ARB/OP for their ecosystems when relevant.
- **Sector/theme leader:** Ethena/ENA and USDe/sUSDe/yield markets, Pendle/yield, LST/restaking, AI, meme, perp DEX, gaming, or other baskets where one leading asset moves and related tokens reprice with lag.

Separate the **trigger market** from the **execution market**:

- Ethereum mainnet may be too competitive for execution, but ETH can still be a trigger/factor.
- Solana may be out of scope for same-chain execution in this lane, but SOL can still explain impulse in Solana ecosystem tokens.
- A trigger can come from BTC, ETH, SOL, ENA/Ethena, or another leader; the tested DEX discrepancy can still live on a cheaper/lower-competition chain or venue.

What RALPH must measure:

- leader/factor impulse timestamp;
- BTC regime and ETH/major confirmation state at the time of the impulse;
- follower-token response lag at 1s, 5s, 15s, 1m, next block, and next 2 blocks;
- whether DEX venues for the follower token disagree after the impulse;
- whether the discrepancy survives the e2e latency and full cost stack;
- whether the leader/follower relationship is repeatable or only anecdotal.

This reframes the harness as **factor-triggered e2e latency and stale-state measurement**, not BTC-only monitoring.

Decomposition target:

```text
target move = BTC beta + ETH/major beta + ecosystem/sector leader beta + residual move
```

The opportunity is more likely in residual lag, stale DEX state, or venue disagreement than in simply observing that all assets moved with BTC.

Budget ladder:

1. **`$0-$50/month`: research and backtest only**
   - Use free/no-key CEX WebSockets for leader/factor impulse detection, DefiLlama/GeckoTerminal-style public data for discovery, and free/low-tier RPC where possible.
   - Good for historical persistence checks and rough live latency sampling.
   - Not enough for execution confidence.

2. **`$50-$150/month`: serious measurement**
   - One paid RPC plan plus a cheap VPS/local collector can run an e2e latency and stale-state harness on one or two chains.
   - Goal is to prove whether public/cheap infra can observe quotes fast enough.
   - Still read-only; no execution expectation.

3. **`$150-$300/month`: best realistic Tomas budget**
   - A stronger paid RPC plan plus possibly a second cheap provider for comparison/fallback.
   - Enough to run focused event-triggered measurement, block-level backtests, live quote timing, and maybe simulation timing.
   - Potentially enough for rare-window strategies only if discrepancies persist for at least one or two blocks and net profit per trade clears infra, gas, failures, and capital risk.

4. **`$1000+/month`: execution-grade / low-latency infra**
   - Dedicated endpoints, higher flat RPS, private/dedicated nodes, or specialized provider add-ons.
   - Do not buy unless the lower-budget harness has already found repeatable post-cost opportunities.

Profitability framing:

- If infra is `$300/month` and the system only trades 10 times/month, each trade must net more than `$30` after all gas, slippage, failures, and risk just to pay infra.
- If it trades 30 times/month, infra hurdle is `$10/trade`.
- If it trades only during rare factor impulse events and average post-cost edge is small, expensive infra destroys the strategy before market risk does.
- Therefore the first real question is not "what is the fastest infra?" but "what is the cheapest infra tier at which the measured opportunity still survives?"

Private-node stance:

- A private node is not needed for the first measurement stage.
- Public/cheap RPC plus archive or indexed state can test persistence and latency enough to decide whether to continue.
- Private/dedicated infra becomes relevant only if opportunities survive long enough historically but cheap live reads are too stale/slow.

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
