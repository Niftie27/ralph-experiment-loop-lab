---
title: Zela Replacement Infra Access Map
date: 2026-10-04
status: access-map
tags:
  - ralph
  - infra
  - rpc
  - dex-discrepancy
  - latency
  - factor-trigger
---

# Zela Replacement Infra Access Map

Scope: backlog item 2 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Replace Zela as a live option with accessible current infrastructure for read-only DEX discrepancy measurement.

Rule: classify access by what this workspace can actually use now. Paid/keyed products are `needs_approval` or `watch`, not active.

## Bottom Line

Zela is not a live option. The practical replacement is a **measured multi-provider EVM read path**:

1. no-key public HTTP RPC for cheap baseline reads;
2. no-key public WebSocket where available for block/log timing probes;
3. low-cost paid RPC only after the free path proves the opportunity class is not already dead;
4. local/offline simulation only as `eth_call`/quoter/static-call for now, because this workspace currently has Node/npm but no installed `anvil`, `forge`, `cast`, or local Hardhat package.

Current active targets:

- **Avalanche:** active baseline. Official HTTP and official/public WebSocket are reachable; DefiLlama 24h DEX volume probe returned about `$101.4M`.
- **Base:** active measurement/control. Official HTTP is reachable and Flashblocks-enabled, but official public Base WebSocket is not served; PublicNode WebSocket works. DefiLlama 24h DEX volume probe returned about `$670.8M`.
- **Mantle:** active cheap niche check. Official HTTP is reachable, PublicNode WebSocket works, official WebSocket failed from this workspace at probe time. DefiLlama 24h DEX volume probe returned about `$15.0M`.

Thin chains remain watch-only unless a concrete pair pocket appears:

- Sonic: about `$876k` 24h DEX volume in the probe.
- Linea: about `$216k`.
- Scroll: about `$44k`.
- ZKsync Era: about `$81k`.

## Live Probe Snapshot

Probe time: 2026-10-04 UTC, from this workspace. These are not SLA guarantees; they are access proof points.

| Chain | Endpoint | Access | Probe result | Archive-ish state probe | RALPH status |
|---|---|---:|---|---|---|
| Avalanche | `https://api.avax.network/ext/bc/C/rpc` | no-key HTTP | `eth_chainId=0xa86a`, block ok, ~77-97ms basic calls | `eth_getBalance` 1M blocks back ok, ~697ms | active baseline |
| Avalanche | `wss://api.avax.network/ext/bc/C/ws` | no-key WS | connection opened, but `eth_chainId` method returned unavailable | not tested | active with method caveat |
| Avalanche | `https://avalanche-c-chain-rpc.publicnode.com` | no-key HTTP | `eth_chainId=0xa86a`, block ok, ~70ms | 1M-back state returned `block not found` | active for current reads only |
| Avalanche | `wss://avalanche-c-chain-rpc.publicnode.com` | no-key WS | `eth_chainId=0xa86a`, ~460ms | not tested | active WS fallback |
| Base | `https://mainnet.base.org` | no-key HTTP | `eth_chainId=0x2105`, block ok, ~142-148ms | 1M-back state ok, ~119ms | active baseline |
| Base | `wss://mainnet.base.org` | no-key WS | failed, matching docs that public endpoints are HTTP-only | n/a | inactive |
| Base | `https://base-rpc.publicnode.com` | no-key HTTP | `eth_chainId=0x2105`, block ok, ~68-82ms | archive requires personal token | active current reads only |
| Base | `wss://base-rpc.publicnode.com` | no-key WS | `eth_chainId=0x2105`, ~440ms | not tested | active WS fallback |
| Mantle | `https://rpc.mantle.xyz` | no-key HTTP | `eth_chainId=0x1388`, block ok, ~180-187ms | 1M-back state ok, ~174ms | active baseline |
| Mantle | `wss://ws.mantle.xyz` | no-key WS | failed from this workspace | n/a | watch/retest |
| Mantle | `https://mantle-rpc.publicnode.com` | no-key HTTP | `eth_chainId=0x1388`, block ok, ~80-91ms | historical state unavailable | active current reads only |
| Mantle | `wss://mantle-rpc.publicnode.com` | no-key WS | `eth_chainId=0x1388`, ~400ms | not tested | active WS fallback |

## Data Source Access

| Source | What it can do | Access status | Probe/source | RALPH use |
|---|---|---:|---|---|
| DefiLlama volumes API | Chain-level DEX volume and rough triage | active no-key | `https://api.llama.fi/overview/dexs/{chain}` responded for target chains | chain/venue triage prior, not execution data |
| GeckoTerminal Public API | Token/pool discovery, pool market data, OHLCV; broad DEX coverage | active no-key | `https://api.geckoterminal.com/api/v2/networks` returned 200; docs say free public API and 30 calls/min | discovery-first pump lane; too coarse for sub-second proof |
| DexScreener API | Pair lookup/search, liquidity/volume/price-change snapshots | active no-key | search endpoint returned 200; docs list 300 rpm for pair/search/token-pair endpoints | pair overlap scouting and sanity checks |
| Binance public WebSocket | BTC/ETH/major tick, trade, book streams for factor triggers | active no-key | `btcusdt@bookTicker` returned live data; docs list 24h connection lifetime and stream limits | BTC/ETH/major trigger stream |
| Coinbase public WebSocket | BTC/ETH/USD market data and fallback trigger stream | active no-key | subscription ack received for `BTC-USD` ticker; docs say traditional feed is available without auth | CEX trigger fallback/control |
| Hyperliquid public WebSocket | Perp trades/book streams for majors/alt factor triggers | active no-key | subscription ack received for BTC trades; docs list mainnet WS endpoint | perp-market trigger/funding/orderflow context |
| Dune / indexed SQL APIs | Historical pool/event datasets | needs_approval/watch | API/pricing/credits require account/key and credit governance | later historical enrichment, not active |

## Paid/Keyed RPC Options

These are **not active** unless Tomas approves account/key/spend.

| Provider | Source-backed facts | Status for RALPH |
|---|---|---|
| Alchemy | Pricing docs show Free tier with 30M compute units, 300 CU/s, full archive data, transaction simulation, and Smart WebSockets; PAYG is `$0.525/M CU`. | needs_approval. Good candidate for Base/Avalanche if free-key setup is allowed; classify as paid-later despite free tier because it requires account/key. |
| Chainstack | Pricing page shows Developer Free with 3M requests, 25 RPS, 1 node, WebSockets; Growth `$49/mo` includes 20M requests, 250 RPS, 10 nodes, Archive Data. | needs_approval. Fits Tomas's `$50-$150` serious-measurement tier if free public path is insufficient. |
| QuickNode | Docs confirm Avalanche HTTP/WSS endpoints and plan-dependent rate limits/pricing. | watch/needs_approval. Useful if chain support and latency beat cheaper options; not first active path. |
| Ankr | Docs classify Public as best-effort/no SLA and Premium PAYG as private endpoints/priority routing. Public Mantle endpoint appears Premium-only on Ankr-branded Mantle page. | watch/needs_approval. Public endpoints can be tested when available; Premium is not active. |
| PublicNode archive tokens | PublicNode works for current HTTP/WS on several chains, but Base archive probe requested a personal token and Mantle/Avalanche public archive probes failed. | active for current reads; needs_approval for archive access. |
| Tenderly | Simulator/Virtual TestNets are good for forked simulation workflows, but require account/API usage and may be overkill before quote viability. | watch/needs_approval. Use only after raw quote viability exists. |

## Simulation / Fork Status

Current local workspace:

- `node`, `npm`, and `npx` are available.
- `anvil`, `forge`, `cast`, and `hardhat` are not globally installed.
- The audited `arbitrage_bot` clone does not currently have local `node_modules/.bin/hardhat`.

Active simulation path now:

- on-chain read-only quoter calls via RPC;
- `eth_call`/`staticCall` for quote and route validation;
- historical `eth_getBalance`/contract calls only where the public endpoint actually supports archive state.

Not active:

- local mainnet fork;
- Tenderly fork/simulation;
- private node;
- transaction signing/submission;
- bundle simulation.

## Recommended Measurement Stack

Stage 0, no-key baseline:

- BTC/ETH/major triggers from Binance, Coinbase, and Hyperliquid public WebSockets.
- Chain reads from official/public RPC endpoints:
  - Avalanche official HTTP + official/PublicNode WS;
  - Base official HTTP + PublicNode WS;
  - Mantle official HTTP + PublicNode WS.
- Discovery/triage from DefiLlama, GeckoTerminal, and DexScreener.
- Output: latency/freshness table, block lag, quote-call error rates, and whether public endpoints are too stale/slow before any paid infra.

Stage 1, low-cost paid-later if Stage 0 survives:

- One account/key provider for a single candidate chain first.
- Prefer a provider that offers WebSocket, archive, and high enough `eth_call` throughput inside `$50-$150/mo`.
- Do not jump to `$300/mo` unless no-key/cheap-key probes show repeatable post-cost quote survival.

Stage 2, execution-grade only if evidence forces it:

- Dedicated/private nodes, bundle paths, and premium simulation belong above Tomas's normal budget and require a repeatable edge first.

## Sources

- Avalanche C-Chain RPC docs: `https://docs.avax.network/docs/rpcs/c-chain`
- Base RPC docs: `https://basehub.org/api-reference/rpc-overview/`
- Mantle RPC/WS docs: `https://github.com/mantlenetworkio/mantle`
- PublicNode directory: `https://www.publicnode.com/`
- DefiLlama volumes API mapping: `https://app.unpkg.com/defillama-api@1.0.2/files/README.MD`
- GeckoTerminal API docs: `https://apiguide.geckoterminal.com/`
- GeckoTerminal FAQ/rate limit: `https://apiguide.geckoterminal.com/faq`
- DexScreener API docs: `https://docs.dexscreener.com/api/reference`
- Binance WebSocket docs: `https://developers.binance.com/en/docs/products/derivatives-trading-coin-futures/websocket-market-streams/Connect`
- Coinbase Exchange WebSocket docs: `https://help.coinbase.com/en/developer-platform/websocket-feeds/exchange`
- Hyperliquid WebSocket docs: `https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket`
- Alchemy pricing docs: `https://www.alchemy.com/docs/reference/pricing-plans`
- Chainstack pricing: `https://chainstack.com/pricing/`
- QuickNode Avalanche endpoint docs: `https://www.quicknode.com/docs/avalanche/endpoints`
- Ankr SLA/service reliability docs: `https://www.ankr.com/docs/rpc-service/sla/`
- Tenderly Simulator: `https://tenderly.co/products/simulator`

## Backlog Implication

Backlog item 2 is complete enough to move to item 3, **Chain and venue triage**. The triage should rank Avalanche, Base, and Mantle first, then only consider thinner chains if a pair-first scan finds a specific active pocket.
