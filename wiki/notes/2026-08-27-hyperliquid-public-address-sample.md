---
type: note
name: Hyperliquid Public Address Sample
created: 2026-08-27T05:45:00Z
last_updated: 2026-08-27T05:45:00Z
tags:
  - copytrading
  - wallet-shadowing
  - hyperliquid
  - no-key
sources:
  - https://app.hyperliquid.xyz/leaderboard
  - https://hyperdash.com/explore/global
  - https://hypertracker.io/
  - https://app.coinmarketman.com/hypertracker/leaderboards
  - https://hypurrscan.io/address/0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5
related:
  - ../../decisions/copytrading-watch-ledger.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-address-intake.md
  - ./2026-08-26-copytrading-autoresearch-lane.md
---

# Hyperliquid Public Address Sample

Status: bounded public/no-key sample for the copytrading/wallet-following lane.

This is not a candidate promotion. It tests whether addresses discovered from public Hyperliquid surfaces can be independently checked through the official public `info` endpoint before any paper-trade spec.

## Public Route Check

Search and page checks on 2026-08-27 found active public discovery surfaces:

- Hyperliquid official leaderboard exists as a public app surface.
- HyperDash exposes global trader and copytrading discovery pages, but the page is largely JavaScript-rendered from this runtime.
- HyperTracker describes no-account dashboard search, leaderboard filters, wallet cohorts, and complete wallet trade/profile views; its API is a paid/keyed product beyond a small free request allowance, so it remains `watch/needs-access` for programmatic use.
- CoinMarketMan HyperTracker leaderboard is JavaScript-only in this runtime.
- HypurrScan address pages are directly discoverable by search and usable as source leads.

## No-Key API Probe

The following addresses were probed locally with:

- `POST https://api.hyperliquid.xyz/info` `{ "type": "clearinghouseState", "user": "<address>" }`
- `POST https://api.hyperliquid.xyz/info` `{ "type": "userFills", "user": "<address>" }`

| Address | Public source path | `clearinghouseState` | `userFills` | Latest observed fill in capped response | Read |
| --- | --- | --- | --- | --- | --- |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | HypurrScan search result | 200 OK; account value `0.0`; no open perp positions | 200 OK; 2000 rows returned | ETH close-short fills around 2026-05-18T16:02:32Z with positive closed PnL in returned rows | Historical ETH shorting activity, currently flat; useful as fetchability sample only |
| `0x1d52fe9bde2694f6172192381111a91e24304397` | HypurrScan search result | 200 OK; account value `0.0`; no open perp positions | 200 OK; 2000 rows returned | APEX close-long fills around 2025-10-10T20:59:34Z with negative closed PnL in returned rows | Historical APEX activity and liquidation-era clue; reject as copy candidate until full history/intent is known |
| `0xc2a30212a8ddac9e123944d6e29faddce994e5f2` | HypurrScan search result | 200 OK; account value `0.000068`; no open perp positions | 200 OK; 2000 rows returned | BTC open-long fills around 2025-11-10T00:36:04Z in returned rows | Historical BTC activity, currently flat; sample only |
| `0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae` | Existing local Trump-person radar address | 200 OK; account value `0.0`; no open perp positions | 200 OK; 2000 rows returned | SOL close-long fills around 2026-01-31T18:43:33Z with negative closed PnL in returned rows | Keep radar-only; not a copy candidate |

## Interpretation

The no-key rail works for known addresses, including public-search leads. It does not solve discovery quality. Public leaderboards and search results can provide address seeds, but the next gate must avoid:

- leaderboard survivorship bias;
- one-hit PnL;
- stale or emptied accounts;
- hidden hedges and transferred capital;
- fast-perp latency mismatch;
- treating a copied public profile as proof of repeatable edge.

## Repeatable Intake Result

Added a small no-dependency intake runner at `experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs`.

Verification command:

- `npm run intake:hyperliquid --prefix ralph-research-os/experiments/copytrading-address-intake`
- `npm run intake:hyperliquid --prefix ralph-research-os/experiments/copytrading-address-intake -- --addresses ralph-research-os/experiments/copytrading-address-intake/data/sample-addresses.json`

The default sample lives at `experiments/copytrading-address-intake/data/sample-addresses.json`. New public cohorts can now be tested by passing another JSON file with `{ address, source, initialStatus }` rows, without editing the script.

Generated outputs:

- `experiments/copytrading-address-intake/results/hyperliquid-address-intake.json`
- `experiments/copytrading-address-intake/results/hyperliquid-address-intake.md`

The verified run generated on 2026-08-27T16:38:18Z keeps the overall verdict conservative:

| Address | Intake status | Returned fill window | Returned closed PnL sum | Main reason |
| --- | --- | --- | ---: | --- |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | `watch/sample-only` | 2026-05-18T16:02:28Z to 2026-05-18T21:59:32Z | `1041128.354342` | profitable returned ETH-only capped slice, but currently flat and stale/emptied |
| `0x1d52fe9bde2694f6172192381111a91e24304397` | `rejected-as-copy/watch-as-evidence` | 2025-10-10T20:59:34Z to 2026-01-07T00:00:00Z | `-12948410.205726` | currently flat, capped history, negative returned close-fill PnL |
| `0xc2a30212a8ddac9e123944d6e29faddce994e5f2` | `rejected-as-copy/watch-as-evidence` | 2025-11-10T00:36:04Z to 2025-11-11T21:21:02Z | `-416143.727775` | currently flat, capped history, negative returned close-fill PnL |
| `0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae` | `watch/radar-only` | 2026-01-31T18:43:33Z to 2026-01-31T18:43:52Z | `-36768308.936506` | keep as event radar only; not copyable from returned evidence |

## Next Gate

Before any frozen cohort or paper-trade spec, build an address intake report that separates:

1. discovery route quality: dashboard, explorer, API, paid product, local source;
2. history quality: full-history, capped recent fills, dashboard-only, manual;
3. behavior class: fast perp, swing perp, event radar, funding/basis, slow accumulator, cohort flow;
4. copyability: expected delay tolerance, liquidity, capacity, drawdown, and exit-shadowing risk;
5. status: `watch`, `proposed`, `needs-access`, or `rejected`.

Current verdict: continue using public Hyperliquid/HypurrScan/HyperTracker-style surfaces as candidate-source rails, but do not promote individual public addresses from this sample. The useful finding is that independent no-key verification is cheap enough to run before a lead enters the ledger.

Self-check: research-only; public/no-key sources only; no live copying; no trading; no exchange or wallet keys; no paid APIs; no cron/cadence change; no watcher wording, risk, sizing, TP/SL, execution, or orders changed. OpenClaw bridge ingest/search verified as `RALPH Hyperliquid Public Address Sample`.
