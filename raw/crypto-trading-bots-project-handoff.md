# Crypto Trading Bots — Project Handoff / ROADMAP

> **Purpose of this doc:** a complete, portable snapshot so the whole project can be
> picked up elsewhere (new machine, new agent, after a break) and continued without
> re-deriving context. Written operator-style, dense on purpose.
>
> **Owner:** Tomas — self-taught dev (bootcamp + Dapp University mentorship), CLI-native
> ("Terminal guy"). Strong across Go, Rust, Solana, EVM infra.
> **Goal:** *any* level of sustained profitability (learning project, not big returns).
> **Capital:** ~$1,000–$2,000. **Infra:** Hetzner CX22 (2 vCPU, 8 GB RAM, Ubuntu 22.04 / WSL2 dev).
> **Discipline:** *monitor first, execute later* — prove edge with data before building execution.

---

## 0. TL;DR — where things stand right now

- **Active focus: Polymarket.** Python scanner is at **v0.2**, monitoring-only. Two unknowns must be
  closed before any live execution (see §3.2).
- **MEV bot on Base L2:** MVP / **monitoring-only**. 9-issue remediation audit done, 12 patched files
  delivered **as a separate tarball** (`mev-bot-fixes.tar.gz`) — **but the canonical repo committed in
  this project is still pre-patch in several files** (see §5.1, this is the #1 gotcha).
- **Backlog (in priority order):** Morpho liquidations → Aave L2 liquidations (timing play) →
  MegaETH scout → Zela/Solana liquidation monitor addon.
- **No end-to-end validation run on the target VPS yet.** Execution path is not wired end-to-end
  (see §4.6).

---

## 1. Strategy stack (the ranked plan, data-driven)

Established after a 5-day research sprint (Dune, EigenPhi, Flashbots/Hummingbot Discord, 1inch API,
GitHub, X). Ranking is backed by numbers, not vibes:

1. **Polymarket** — 15-minute crypto (BTC/ETH/SOL up-or-down) + weather/forecast markets.
   Public APIs, capital matches $1–2K, documented small-capital success cases ($1K→$24K weather
   trajectories), open-source tooling exists (poly-maker, OpenClaw/Polyclaw, Polymarket/agents).
   15-min crypto markets are *event-selective*, not always-on.
2. **Morpho liquidations** — strongest on-chain option. Morpho passes the **full** liquidation
   incentive to liquidators with **no SVR-style recapture**. Open-source bots in TS/Rust/Go.
   Unknown: competition density.
3. **Aave L2 liquidations** — *timing play*. Aave integrated Chainlink **SVR** (recaptures
   liquidation MEV, ~73% recapture rate). SVR expansion to **Base/Arbitrum was only proposed
   (~Mar 6)** — there may be a narrow window before it activates and closes the edge.
4. **MegaETH new-chain arb** — **scout only**. Early "$40 daily DEX volume" figure was a launch-day
   snapshot; real volume is ~$3M/day but thin and concentrated on one DEX. Monitor, don't build.

**Solana track (parallel):** Zela addon — top opportunity is a **liquidation monitor**, because no
major Solana lender (Solend, MarginFi, Kamino) has SVR-style recapture — same gap Aave had pre-SVR.

---

## 2. Active focus — Polymarket scanner

### 2.1 What's built (scanner v0.2, Python, no auth, read-only)
Files (delivered to outputs previously): `scanner.py`, `analyze.py`, `requirements.txt`, `README.md`.

- **Discovery** via Gamma API (`https://gamma-api.polymarket.com`):
  - documented params: `closed`, `tag_id`, `slug`, `limit`, `offset`, `active`
  - **offset/limit pagination** (100/page, stop on short page, `max_pages` cap)
  - 15-min crypto: try slugs `btc/eth/sol/xrp-15-minute` first, then keyword fallback
    (`"15 minute"/"15-minute"/"15min"/"up or down"` × coin keywords)
  - weather: keywords (`temperature`, `high temp`, `degrees`, `weather forecast`) × cities
    (new york, london, chicago, seoul, tokyo, los angeles)
  - **dedup by condition_id**; **snake_case ↔ camelCase field fallbacks** (`_gf` helper)
- **Order book** via CLOB API (`https://clob.polymarket.com`, `py_clob_client`): best bid/ask per
  outcome, spread (abs + %), midpoint, depth (top levels both sides), complete-set arb signal
  (YES+NO ≠ $1.00) → logged to JSONL (`scan_logs/`).
- **Depth at clip size**: `clip_depth()` checks fillability at **$100 / $300 / $1,000** notionals.
- **Fee-aware analysis**: `est_fee = rate * min(price, 1-price) * size` (Polymarket's documented formula).
- **WebSocket persistence tracker**: connects to
  `wss://ws-subscriptions-clob.polymarket.com/ws/market` to see if quotes persist or vanish.
- **Verdict engine** (`analyze.py`): PROMOTE / EXTEND / KILL based on tight-spread fraction,
  depth fraction, and arb signals.

**Run:**
```bash
pip install -r requirements.txt
python scanner.py --once            # smoke test discovery first!
python scanner.py --mode crypto     # monitor 15-min markets
python scanner.py --mode weather
python analyze.py --summary         # verdict after 1–24h of data
```
> Known risk: Gamma tagging for 15-min/weather markets drifts; if `--once` finds zero markets,
> tune tags/keywords against the live API response before trusting results.

### 2.2 The two remaining unknowns (must close before live)
1. **Liquidator/maker competition density** in the target Polymarket markets (and on Base/Arbitrum
   for the liquidation backlog).
2. **Live order-book depth** in the specific target markets — i.e., is there real executable
   liquidity at your clip sizes, not just quoted spread.

Both are answered by **looking at the live platform with the scanner**, not by reading articles.

### 2.3 Build pipeline (gate each step on data)
`Scanner (record spreads+depth) → Analyze (kill/promote) → Paper trader (no capital) → Live
(py-clob-client)`. Only advance to paper trading if analyzer says **PROMOTE**. If **KILL** →
fall back to Morpho liquidations.

---

## 3. MEV bot — Base L2 (architecture & current state)

**Phase:** MVP / monitoring-only. **Chain:** Base (chain ID 8453).
**Stack:** Go 1.22 (scraper, pairwatcher, sim-pool) + Rust (strategy-shadow, bundler) over
**NATS JetStream**, **PostgreSQL 15**, **Prometheus + Alertmanager**, Docker Compose, GitHub Actions CI.

### 3.1 Services, ports, NATS subjects
| Service | Lang | Metrics port | NATS subject | Notes |
|---|---|---|---|---|
| scraper-go | Go 1.22 | 2112 | `raw.tx` | polls `eth_getBlockByNumber("pending")` every **500 ms**, batches 100 tx → JetStream `RAW` (memory, 5 min) |
| pairwatcher-go | Go 1.22 | 2113 | `dex.pair` | GraphQL poll (60 s) + `subscribePairCreated` **stub** (no real ethclient sub yet) → `DEX` stream |
| strategy-shadow-rs | Rust | 2114 | `sim.req`/`sim.resp` | filters `raw.tx` to top-50 seed wallets → publishes `sim.req` |
| bundler-rs | Rust | 2115 | `exec.order` | consumes `exec.order`, tip-cap + gas-cap guards, submits to relay |
| anvil-pool (sim-pool) | Go 1.22 | 9200 | (HTTP `/simulate`) | round-robin anvil workers; **HTTP**, not a NATS `sim.req` consumer |

### 3.2 Data flow (intended)
```
QuickNode + 2 public WS → scraper-go (batch 100 pending tx)
        │ NATS raw.tx
        ▼
pairwatcher-go (GraphQL) → strategy-shadow-rs (50 seed wallets)
  NATS dex.pair            │ sim.req / exec.order
                     +-----+-----+
                     │           │
                anvil-pool   Tenderly  (dual-sim if predicted PnL > $5)
                     │           │
                     ▼           ▼
                  bundler-rs (gas-cap enforced)
                     │
              flashbots / titan / raw-rpc
```

### 3.3 Gas-cap formula (core risk control)
```
per_tx_gas_cap = min(0.10 * BANKROLL, 2 * rolling_median_gas_24h)
```
Recomputed daily, logged to Prometheus. Bundler also enforces `tip_cap <= 50 gwei` (hard const
`MAX_TIP_GWEI = 50`). Daily budget = 10% of bankroll; resets every 24h.

### 3.4 Strategy modes
- **wallet-shadow (ENABLED):** monitor top-50 seed wallets from `seed_wallets.csv` (sorted by ROI),
  simulate when predicted PnL > $5.
- **launch-sniper (OFF):** feature-gated skeleton only (`cargo build --release --features sniper`),
  not implemented.

### 3.5 Dual simulation (when predicted PnL > $5)
1. local anvil fork sim → 2. Tenderly REST diff-check → 3. abort bundle on mismatch.
**Status: not wired** (see §6). Tenderly env vars exist; the actual call path is a TODO.

### 3.6 Database (PostgreSQL 15)
Tables: `tx_raw` (pending mempool, RANGE-partitioned weekly on `seen_at`, pattern `tx_2026w10`),
`pair_events` (partitioned on `observed_at`), `bundle_log` (audit, JSONB relay_response).
`create_weekly_partition()` auto-creates 4 weeks ahead. Archival: `dump_parquet.sh` exports >30d data
to Parquet (DuckDB preferred, pandas fallback) then prunes.

### 3.7 Monitoring & alerts (`alert_rules.yml`)
ServiceDown (>2m), HighP95Latency (scraper p95 >120ms /3m), GasDailyOverCap (>10% bankroll),
LowBundleAcceptRate (<40% /1h), AllRPCUnhealthy (0 healthy), SimPoolSlow (anvil p95 >2s),
NATSMemoryHigh (>85%). Prometheus scrapes every 15s; 30d TSDB retention.

---

## 4. Remediation audit — 9 issues / 12 patched files

A structured audit resolved **nine deployment-blocking issues**. Output: 12 patched files, a
compose v1/v2 wrapper (`dc`), monitoring-safe `.env.example`, a CI smoke-test job, rewritten README.

### 4.1 ⚠️ #1 GOTCHA — patches are NOT merged into the committed repo
The patches were delivered as **`mev-bot-fixes.tar.gz`** (a `patched/` tree). The repo committed in
this project still shows the **pre-patch state** in these files (verified):
- `.env` → `GRAPH_ENDPOINT=https://error.thegraph.com/apierror.json` (dead placeholder)
- `docker-compose.yml` → `VAULT_SIGNER_KEY:?` hard-fail, **no `profiles: ["trading"]`**, passes
  `BANKROLL` (bundler reads `BANKROLL_ETH`), GRAPH_ENDPOINT defaults to dead hosted subgraph
- `Dockerfile.sim-pool` → `foundry:latest` (not pinned to `:stable`)
- `rust/*/Dockerfile` → `rust:latest` (not pinned `1.86-slim`, missing `libssl-dev`)
- `README.md` → still says Rust 1.77
- `strategy-shadow/src/main.rs` → `SeedWallet { address, roi }` vs CSV columns
  `address,label,roi_30d,total_pnl_usd,tx_count,first_seen` → **deserialization panics on startup**

**Action on pickup:** merge the tarball patches into the canonical repo (or re-apply), then re-run CI.

### 4.2 The nine issues + fixes
| # | Issue | Root cause | Fix |
|---|---|---|---|
| 1 | CSV/struct mismatch | `SeedWallet{address,roi}` ≠ 6-col CSV | expand struct to 6 fields, `#[serde(rename="roi_30d")]`, sort on renamed field |
| 2 | Compose hard-fail | `VAULT_SIGNER_KEY:?` blocks monitoring start | move trading services behind `profiles:["trading"]`; key no longer hard-fails |
| 3 | Foundry tag | `foundry:latest` non-reproducible | pin `foundry:stable` (+ note: pin to digest for full repro) |
| 4 | Rust toolchain | `rust:1.77` lacks edition2024 | bump `rust:1.86-slim` + add `pkg-config libssl-dev`; bump quarterly |
| 5 | `.env.example` clarity | secrets needed just to boot | split REQUIRED (monitoring) vs OPTIONAL (trading); works out of the box w/ public RPC |
| 6 | DB name alignment | dbname=username fallback crash | new `migrations/000_ensure_db.sh` creates `mev` alias; `mevbot` canonical |
| 7 | Dead Graph endpoint | hosted subgraph service shut down | default empty; migrate to Graph Gateway (`gateway.thegraph.com/api/<KEY>/subgraphs/id/<ID>`); Base UniV3 subgraph id `4xyasjQeREe7PxnF6wVdobZvCw5mhoHZq8T6YE3dM8wW` (verify) |
| 8 | No CI smoke test | build-only CI | add smoke-test job: boot core stack, curl scraper metrics + NATS health |
| 9 | Compose v1/v2 + restart loops | one-shot Rust svcs restart-looped | `dc` wrapper auto-detects compose version; `restart:"no"` correct under profiles |

The 12 patched files: `docker-compose.yml`, `Dockerfile.sim-pool`, `rust/strategy-shadow/Dockerfile`,
`rust/bundler/Dockerfile`, `.env.example`, `migrations/000_ensure_db.sh` (new), `dc` (new),
`Makefile` (added `tidy`/`run-trading`/`status`), `ci.yml` (go.sum check + smoke-test),
`README.md` (rewrite), `strategy-shadow-main-rs.patch` (the CSV fix), plus README_QUICKSTART.

**Key architectural decision:** monitoring stack runs by default with **zero secrets**; trading
services (`bundler-rs`, `strategy-shadow-rs`) only start via `docker compose --profile trading up -d`.
Fresh clone + `cp .env.example .env` + `docker compose up -d` should just work.

---

## 5. Open technical debt register

1. **BANKROLL vs BANKROLL_ETH** env mismatch (compose passes `BANKROLL`, bundler reads `BANKROLL_ETH`).
2. **Dead Graph endpoint** in `.env` (`error.thegraph.com/apierror.json`) — migrate to Graph Gateway.
3. **Foundry image tag** not pinned (`:latest` in `Dockerfile.sim-pool`).
4. **SeedWallet struct / CSV field alignment** — confirm the `#[serde(rename)]` fix is merged.
5. **No confirmed end-to-end validation run** on the target VPS.
6. **Hardcoded `GasUsed`** — `sim-pool/main.go` sets `result.GasUsed = 21000` unconditionally (it only
   does `eth_call`, never reads real gas).
7. **Tenderly dual-sim wiring unimplemented** — env + `TenderlyResult` struct exist, no actual call.
8. **Execution path not wired end-to-end** (see §4.6): `strategy-shadow` publishes `sim.req` over NATS,
   but `anvil-pool` exposes an **HTTP** `/simulate` (no `sim.req` consumer), and **nothing produces
   `exec.order`**, so `bundler-rs` has no input. System is genuinely monitoring-only until this is built.
9. Rust toolchain / README version drift (1.77 vs 1.86) until patches merged.

### 5.1 Test coverage gaps
- Go: only `internal/rotator` is tested (`rotator_test.go`). **scraper, pairwatcher, sim-pool = zero tests.**
- Rust: `strategy-shadow` has unit tests (CSV load, set membership, serialization); `bundler` has good
  unit tests (relay parsing, gas-cap math, exec-order deserialize). ~18 unit tests total.

---

## 6. Strategic fork decision (pending)

**Question:** replace `bundler-rs` with a **flashbots/op-rbuilder** fork, given the Base/OP-stack target?
- op-rbuilder (Rust, MIT) is the OP-Stack block builder powering **Base Flashblocks (200 ms blocks)**.
- **Licence caution:** Flashbots **mev-boost-relay is AGPL** — must not be embedded in proprietary
  code; isolate behind a process boundary if used.
- **Timing implication:** Base runs 200 ms Flashblocks via op-rbuilder → the scraper's **500 ms poll
  is mismatched**; revisit polling interval / preconfirmation strategy.
- Integration plan if forking: design NATS subject taxonomy beyond `raw.tx / sim.req / exec.order /
  dex.pair`; minimal-diff fork patches with NATS+JetStream hooks; enable trading mode with guards;
  run with small bankroll (≤1 ETH) under live monitoring.

---

## 7. Backlog (on the horizon)

- **Morpho liquidations** — full incentive to liquidator, no SVR tax. Deploy an OSS bot (TS/Rust/Go).
  Gate on competition-density check. *Strongest on-chain option.*
- **Aave L2 liquidations** — timing play before SVR expands to Base/Arbitrum. Watch governance.
- **MegaETH** — scout only (thin, single-DEX liquidity).
- **Cross-DEX arb (unfinished playbook)** — see §9; 4 chains tested, 4 kills; playbook says test 8+.
- **End-to-end validation run** on the CX22.

---

## 8. Zela / Solana addon (parallel track)

**Zela (zela.io):** execution engine that runs Rust/WASM **co-located with the current Solana leader**
— read + compute + decision in one roundtrip near the validator. Customers: liquidation bots, arb
searchers, market makers.
- **Top opportunity: liquidation monitor** — Solend/MarginFi/Kamino have **no SVR-style recapture** →
  full liquidation bonus available (Aave-pre-SVR gap).
- Solana timing: slot = 400 ms; procedure must finish compute within one slot; **panic = missed slot**
  (error handling must be graceful). Failed tx ~5000 lamports; Zela returns SKIP on no-op (no cost).
- Solana repos to mine: `jito-foundation/jito-solana` (★698, MEV + BAM), `jito-relayer`,
  `coral-xyz/anchor`, `helius-labs/yellowstone-grpc` (Geyser streaming), `pyth-network/pyth-sdk-rs`.
- Tooling gaps = opportunities: nobody does Parsec-style liquidation heatmaps or Forta-style push
  monitoring for Solana.

---

## 9. Key learnings & eliminated paths (don't re-litigate)

- **Cross-DEX arb on Mantle:** spread was *real* (0.215% mean, LB vs Agni V3, $2,874 paper @100% over
  50h) but **execution impossible** — thin Agni pools → round-trip slippage −14.6% even at $100. The
  hypothesis wasn't flawed; the liquidity was. **Always slippage-test immediately on any signal.**
- **Avalanche, Sonic:** killed outright, zero positive spreads.
- **Arbitrum:** too efficient for cross-DEX polling arb; flashloan arb never reached viable stage.
- **Wallet-shadow on Base:** the Coinbase **sequencer controls ordering**, so mempool copy-trading on
  L2 is structurally disadvantaged. Strategy never validated with data — treat as unproven.
- **MegaETH "$40 volume":** launch-day snapshot, not ongoing (~$3M/day real).
- **Morpho > Aave** for liquidations: Morpho passes full incentive; Aave SVR recaptures MEV (~73%).
- **Base gas structure:** Q1 2025 — >55% of gas consumed by speculative cyclic arb bots paying ~5×
  less effective gas → structural angle for a wallet-shadow approach (if the sequencer problem is solved).
- **Infrastructure is not the bottleneck** — finding a venue with real executable edge is.
- **Blocknative** mempool products sunset (Mar 2025). **bloXroute** deferred post-MVP ($300/mo min).

---

## 10. Tooling shortlist & resources

**Adopt (from tooling scout):** **eRPC** (Apache-2.0, replaces custom `rotator.go`), **Tenderly** SaaS
(simulation, replaces FORK_URL diff path), **Flashbots MEV-Share** (L1 orderflow), **HashiCorp Vault
Transit** (signing boundary before live trading).

**Reference repos:** flashbots/op-rbuilder, flashbots/rbuilder, SorellaLabs/brontes,
Polymarket/agents, Hummingbot, Destiner/mev-inspect-js, flashbots/builder-playground.
**Avoid:** flashbots/mev-inspect-py (archived/deprecated).

**Data/research:** Dune Analytics, EigenPhi, DefiLlama, 1inch API
(`api.1inch.dev/swap/v6.0/<chainId>/quote` — Base=8453, Arb=42161), Gamma API, Polymarket CLOB WS,
Flipside/Helius (Solana).
**Communities/X:** Flashbots, Hummingbot Discord; X: samczsun, bertcmiller, libevm.

**Languages/runtimes:** Python (Polymarket), Go 1.22, Rust (target 1.86).
**Infra:** Hetzner CX22, Docker Compose, Ubuntu 22.04 / WSL2.
**Messaging/storage/observability:** NATS JetStream, PostgreSQL 15, Prometheus + Alertmanager.
**Blockchain tooling:** Foundry/anvil, Tenderly, Flashbots MEV-Share, eRPC, HashiCorp Vault Transit.

---

## 11. Current repo file inventory (`/mnt/project`, as committed)

```
docker-compose.yml      # full stack (PRE-patch: no profiles, hard-fail key, BANKROLL)
Dockerfile.go           # multi-arch Go build, ARG SERVICE
Dockerfile.sim-pool     # Go build + foundry:latest (PRE-patch tag)
Dockerfile              # Rust (strategy-shadow & bundler share this pattern; rust:latest PRE-patch)
go.mod / go.sum         # nats.go, prometheus, zap
Makefile                # run/stop/logs/test/lint/bench/migrate/build/clean
README.md               # architecture, quick start, alerts (says Rust 1.77 PRE-patch)
_env / _env.example     # .env files (_ prefix; .env has dead GRAPH endpoint)
_gitignore              # ignores .env, keys, target/, parquet, etc.
main.go (×3)            # scraper, pairwatcher, sim-pool (3 separate cmd mains)
main.rs (×2)            # strategy-shadow, bundler
Cargo.toml (×2)         # strategy-shadow (sniper feature flag), bundler (ethers 2.0)
rotator.go / rotator_test.go   # RPC round-robin + health (the only Go-tested package)
001_init.sql            # DB schema + weekly partition function
server.conf             # NATS JetStream config (2GB mem / 4GB file store)
prometheus.yml / alert_rules.yml   # scrape config + 7 alert rules
ci.yml                  # GitHub Actions (lint/test Go + Rust, docker-build; toolchain 1.77 PRE-patch)
dump_parquet.sh         # >30d archival to Parquet (DuckDB / pandas)
seed_wallets.csv        # 5 rows, 6 cols: address,label,roi_30d,total_pnl_usd,tx_count,first_seen
```
> Note the `_env`, `_gitignore` underscore-prefixing is just how dotfiles were exported here.

---

## 12. Immediate next actions (decision matrix)

| If you want to… | Do this |
|---|---|
| Continue Polymarket (primary) | Run `scanner.py --once`, fix discovery if 0 markets, collect 24–48h, `analyze.py --summary`. Close the two unknowns (§2.2). |
| Get the MEV bot deployable | Merge `mev-bot-fixes.tar.gz` into the repo (§4.1), then run CI + smoke-test, then a real boot on the CX22. |
| Make the MEV bot *trade* | First wire the execution path (§5 item 8) + Tenderly dual-sim (item 7) + real GasUsed (item 6) + BANKROLL_ETH fix (item 1). Then `--profile trading` with ≤1 ETH and live monitoring. |
| Decide the fork | Resolve §6 op-rbuilder question (licence isolation + 200ms timing). |
| Branch to Solana | Prototype the Zela liquidation monitor (§8). |
| Pick the next on-chain edge | Morpho liquidations (§7), gated on competition-density check. |

---

## 13. Working-style notes (for whoever continues — human or agent)

- Prefers **compressed operator memos** over verbose reasoning when directing coding work.
- **Pushes back** when options are narrowed prematurely or conclusions come from theory not data —
  and is usually right; he does independent research between sessions and returns with verified findings.
- Explicitly wants **"I don't know"** over fabricated confidence.
- **Monitor first, execute later** is a hard discipline, not a suggestion.
- Uses ROADMAP-style docs (like this one) to survive breaks; generates formal Word/markdown
  deliverables to communicate across Tech Lead / Lead Engineer roles.
- CLI-native. Capital is small — every "is the edge real and executable?" question matters more than
  infra polish.
```
