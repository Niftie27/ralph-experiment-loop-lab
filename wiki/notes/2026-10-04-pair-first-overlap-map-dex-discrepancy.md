---
title: Pair First Overlap Map for DEX Discrepancy
date: 2026-10-04
status: overlap-map
tags:
  - ralph
  - pair-overlap
  - dex-discrepancy
  - volume-velocity
  - avalanche
  - base
  - mantle
---

# Pair First Overlap Map for DEX Discrepancy

Scope: backlog item 4 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Find same-chain pairs that trade on at least two meaningful DEX venues before any executable-spread kill test.

Depends on:

- [[2026-10-04-zela-replacement-infra-access-map]]
- [[2026-10-04-chain-venue-triage-volume-velocity-dex]]

Data source: GeckoTerminal public pool pages queried on 2026-10-04 UTC. Avalanche grouping used the first 100 pools. Base grouping used the first 80 pools after respecting rate limits. Mantle grouping used first-page data; later pages hit HTTP 429 during this pass, so Mantle is provisional but enough for the repo-relevant overlap check.

## Verdict

First pair family to map into executable quote config:

1. **Avalanche `WAVAX/USDC`** across Pharaoh V3, Uniswap V3, Blackhole V3, Trader Joe LB/V2.2, and optionally Pangolin.
2. **Avalanche `WETH.e/WAVAX`** as the second non-stable/native pair.
3. **Base `WETH/USDC`** as a high-activity latency/control pair, not a presumed edge.
4. **Mantle `USDT0/WMNT`** as the only repo-adjacent Mantle pair currently worth a cheap recheck.

Do not start with Base `xdp` despite huge reported volume until token/pool quality is sanity-checked. Several pools show high volume with near-zero or tiny reported reserves, which is exactly the kind of shallow path that can distract RALPH.

## Candidate Config List

| Priority | Chain | Pair family | Venues observed | 24h volume / reserve signal | Initial notionals | Decision |
|---:|---|---|---|---|---|---|
| 1 | Avalanche | `WAVAX/USDC` | Pharaoh V3, Uniswap V3, Blackhole V3, Trader Joe V2.2/LB, Trader Joe, Pangolin V3 | About `$25.6M` grouped 24h volume, `$8.8M` grouped reserve, 14.6k tx across sampled pools | `$100`, `$300`, `$1000` | First executable-quote kill-test candidate. |
| 2 | Avalanche | `WETH.e/WAVAX` | Pharaoh V3, Uniswap V3, Blackhole V3, Pangolin V3, Trader Joe | About `$5.25M` grouped volume, `$4.7M` reserve, 3.9k tx | `$100`, `$300`, `$1000` | Second candidate; useful non-stable/native pair. |
| 3 | Avalanche | `BTC.b/WAVAX` | Pharaoh V3, Trader Joe V2.2/LB, Blackhole V3, Uniswap V3 | About `$4.1M` grouped volume, `$4.0M` reserve, 2.8k tx | `$100`, `$300` first | Good BTC beta/factor-aware check, but bridge asset caveats apply. |
| 4 | Base | `WETH/USDC` | Aerodrome Slipstream, Pancake V3, Uniswap V3, Aerodrome V1 | About `$64.6M` grouped volume, `$42.8M` reserve, 77.9k tx | `$100`, `$300`, `$1000` | Latency/control chain sample; expect efficient arb. |
| 5 | Base | `VIRTUAL/WETH` | Aerodrome Slipstream, Uniswap V3 | About `$8.4M` grouped volume, `$1.8M` reserve, 32.5k tx | `$100`, `$300` | Better follower-token style control than majors, but likely competitive. |
| 6 | Mantle | `USDT0/WMNT` | Agni Finance, Merchant Moe Liquidity Book | About `$200k` grouped volume, `$8.6M` reserve, 261 tx | `$100`, `$300` | Cheap repo-specific niche recheck. |

## Avalanche Details

### `WAVAX/USDC`

Observed venues and pools:

- Pharaoh V3: `0xf01449c0ba930b6e2caca3def3ccbd7a3e589534`, about `$19.6M` volume, `$4.0M` reserve.
- Uniswap V3: `0xfae3f424a0a47706811521e3ee268f00cfb5c45e`, about `$4.0M` volume, `$3.0M` reserve.
- Blackhole V3: `0x41100c6d2c6920b10d12cd8d59c8a9aa2ef56fc7`, about `$977k` volume, `$546k` reserve.
- Trader Joe V2.2/LB: `0x864d4e5ee7318e97483db7eb0912e09f161516ea`, about `$771k` volume, `$669k` reserve.

Why first: it has volume, reserve, venue overlap, AMM diversity, and accessible Avalanche infra. It may still be too efficient, but that failure would be high-information.

### `WETH.e/WAVAX`

Observed venues and pools:

- Pharaoh V3: `0xff0855a9027f5f5c2bbacc4aac477afbeeefbea9`, about `$4.9M` volume, `$3.7M` reserve.
- Blackhole V3: `0x5e128ebc09c918ddae3ca1668d4ee9527dc00d78`, about `$163k` volume, `$69k` reserve.
- Uniswap V3: `0x7b602f98d71715916e7c963f51bfebc754ade2d0`, about `$138k` volume, `$227k` reserve.
- Trader Joe: `0xfe15c2695f1f920da45c30aae47d11de51007af9`, low volume but about `$593k` reserve.

Why second: less stable-pair efficient than `WAVAX/USDC`, with enough overlap to test but lower depth on secondary venues.

### `BTC.b/WAVAX`

Observed venues and pools:

- Pharaoh V3: `0x5ca009013f6b898d134b6798b336a4592f3b4af2`, about `$4.0M` volume, `$3.8M` reserve.
- Blackhole V3: `0x8fef4fe4970a5d6bfa7c65871a2ebfd0f42aa822`, about `$74k` volume, `$129k` reserve.
- Trader Joe V2.2/LB: `0x856b38bf1e2e367f747dd4d3951dda8a35f1bf60`, about `$29k` volume, `$59k` reserve.
- Uniswap V3: low volume and low reserve.

Why conditional: it directly relates to BTC beta/factor context, but the venue imbalance is large and bridge/wrapped asset behavior can distort reads.

## Base Details

### `WETH/USDC`

Observed venues and pools:

- Aerodrome Slipstream 3: `0x3fe04a59ebd38cf06080a6f60a98d124eb59392a`, about `$22.7M` volume, `$9.6M` reserve.
- Aerodrome Slipstream: `0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59`, about `$20.1M` volume, `$8.6M` reserve.
- Pancake V3: `0x72ab388e2e2f6facef59e3c3fa2c4e29011c2d38`, about `$13.7M` volume, `$5.1M` reserve.
- Uniswap V3: `0xd0b53d9277642d899df5c87a3966a349a798f224`, about `$3.9M` volume, `$10.0M` reserve.

Why useful: excellent for testing quote latency/freshness under high Base activity. Not an edge assumption.

### `VIRTUAL/WETH`

Observed venues and pools:

- Aerodrome Slipstream: `0x3f0296bf652e19bca772ec3df08b32732f93014a`, about `$2.4M` volume, `$381k` reserve.
- Uniswap V3: `0x9c087eb773291e50cf6c6a90ef0f4500e349b903`, about `$2.2M` volume, `$663k` reserve.
- Aerodrome Slipstream 3: `0x9520e1a3bfd86da6c1e9e5ee4b9c2f11c413358f`, about `$1.9M` volume, `$231k` reserve.

Why useful: closer to a factor/follower-token shape than `WETH/USDC`, while still liquid enough for read-only measurement.

### Base Exclusions For Now

- `xdp/USDC` and `xdp/USDT` show extreme volume and many pools, but several sampled pools report near-zero or tiny reserve. Treat as a data-quality/liquidity-shape investigation later, not a first RALPH kill test.
- `USDT/USDC` is liquid and multi-venue, but stable-stable routes are likely highly competitive and less relevant to factor-triggered follower lag.

## Mantle Details

### `USDT0/WMNT`

Observed venues and pools:

- Agni Finance: `0x8fb12e957edbefd0105857fef675d621c8629a71`, about `$181k` volume, `$3.7M` reserve.
- Merchant Moe Liquidity Book: `0xc0729cde19741de280b230d650f0fdad2ad79d09`, about `$19k` volume, `$4.9M` reserve.

Why useful: it is the only currently visible Mantle overlap with enough reserve to justify a cheap repo-specific recheck. Volume is low, so this is not a broad survival candidate.

### Mantle Exclusions For Now

- `WMNT/WETH` is too thin in the public snapshot: Merchant Moe LB had only about `$4k` 24h volume and about `$26k` reserve in the sampled pool.
- Fluxion dominates Mantle volume in the snapshot, but it is outside the audited repo's existing Merchant Moe/Agni quoter path. Fluxion can be mapped later if Mantle survives as a chain target.

## Next Step

Backlog item 5, **Full-cost model spec**, should be done before any kill-test implementation. Pair overlap alone is not enough; RALPH needs the exact cost fields and positive-spread definition before logging anything as viable.

Do not run the executable-spread kill test yet.
