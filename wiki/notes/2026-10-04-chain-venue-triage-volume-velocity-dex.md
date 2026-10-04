---
title: Chain Venue Triage for Volume Velocity DEX Discrepancy
date: 2026-10-04
status: triage
tags:
  - ralph
  - chain-triage
  - venue-triage
  - dex-discrepancy
  - volume-velocity
---

# Chain Venue Triage for Volume Velocity DEX Discrepancy

Scope: backlog item 3 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Update the stale chain list with current DEX volume, venue overlap, AMM diversity, and RPC availability. This is still triage, not a build.

Depends on:

- [[2026-10-04-arbitrage-bot-repo-depth-audit]]
- [[2026-10-04-zela-replacement-infra-access-map]]

## Verdict

Start with **Avalanche** as the first credible kill-test chain.

Use **Base** as a high-activity measurement/control chain, but do not assume it is lower competition. It is liquid and data-accessible, yet likely more efficiently arbed.

Keep **Mantle** as a cheap repo-specific niche check only. The old Merchant Moe vs Agni path is no longer enough by itself because current public data shows Mantle volume is concentrated in venues/pairs outside the audited repo's main Merchant Moe/Agni assumption.

Do not prioritize Sonic, Linea, Scroll, or ZKsync Era unless item 4 finds a concrete pair pocket.

## Chain Ranking

| Rank | Chain | Current volume/access evidence | Venue/AMM shape | Decision |
|---:|---|---|---|---|
| 1 | Avalanche | DefiLlama probe: about `$101.4M` 24h DEX volume. Official HTTP, official/PublicNode WS, and public archive-ish state probe were usable enough for baseline. | Meaningful AMM diversity: Pharaoh DLMM/V3, Uniswap V3/V4, Joe LB/V2, Blackhole V3/AMM, Pangolin V2/V3. Top GeckoTerminal pools include the same major pairs across different venues, especially WAVAX/USDC and WETH.e/WAVAX. | First kill-test candidate. |
| 2 | Base | DefiLlama probe: about `$670.8M` 24h DEX volume. Official HTTP is reachable and Flashblocks-enabled; PublicNode WS works. | Very liquid but competitive: Aerodrome Slipstream, Uniswap V3/V4, Pancake V3/Infinity, Solidly V3. Public data shows heavy activity in both majors and suspiciously high-volume low-reserve tails. | Measurement/control chain, not first survival bet. |
| 3 | Mantle | DefiLlama probe: about `$15.0M` 24h DEX volume. Official HTTP and PublicNode WS work; official WS failed from this workspace. | Repo-relevant venues exist, but current visible volume is dominated by Fluxion and a few Agni/Merchant Moe pools. Merchant Moe LB vs Agni is useful for cheap recheck, not broad chain thesis. | Cheap niche check after Avalanche, unless pair-first scan upgrades it. |
| watch | Sonic | DefiLlama probe: about `$876k` 24h DEX volume. | Too thin at chain level for first pass. | Watch only. |
| watch | Linea | DefiLlama probe: about `$216k` 24h DEX volume. | Too thin at chain level for first pass. | Watch only. |
| watch | Scroll | DefiLlama probe: about `$44k` 24h DEX volume. | Too thin at chain level for first pass. | Watch only. |
| watch | ZKsync Era | DefiLlama probe: about `$81k` 24h DEX volume. | Too thin at chain level for first pass. | Watch only. |

## Venue Evidence

### Avalanche

DefiLlama top chain-volume venues in the probe:

- Pharaoh DLMM: about `$30.5M`.
- Pharaoh V3: about `$29.4M`.
- Uniswap V3: about `$4.8M`.
- Blackhole CLMM: about `$1.6M`.
- Joe V2.2 / Liquidity Book: about `$1.0M`.
- WOOFi, DODO, Joe DEX, Pangolin V3/V2 are smaller but present.

GeckoTerminal first-page pool evidence:

- `WAVAX / USDC 0.09%` on `pharaoh-exchange-v3`: about `$19.5M` 24h volume, `$4.0M` reserve.
- `WAVAX / USDC 0.05%` on `uniswap-v3-avalanche`: about `$4.0M`, `$3.0M` reserve.
- `WAVAX / USDC 0.05%` on `blackhole-v3`: about `$974k`, `$548k` reserve.
- `WAVAX / USDC` on `traderjoe-v2-2-avalanche`: about `$771k`, `$670k` reserve.
- `WETH.e / WAVAX` appears on Pharaoh V3 and Uniswap V3 with meaningful but uneven volume.

Triage read: Avalanche has the best first-pass shape: accessible infra, current volume, visible pair overlap, and structurally different AMM models. The likely first pair family is `WAVAX/USDC`, then `WETH.e/WAVAX`, then `BTC.b/WAVAX` only if pair-overlap survives item 4.

### Base

DefiLlama top chain-volume venues in the probe:

- Aerodrome Slipstream: about `$319.6M`.
- Uniswap V4: about `$189.2M`.
- Uniswap V3: about `$176.9M`.
- PancakeSwap AMM V3: about `$33.4M`.
- Tessera V, Metric V1, PancakeSwap Infinity, Aerodrome V1, Solidly V3 also show material volume.

GeckoTerminal first-page pool evidence:

- `xdp / USDC` on Uniswap V3: about `$192.2M` 24h volume, about `$1.85M` reserve, extremely high transaction count.
- Multiple `xdp` pools appear on Uniswap V4 with high volume and near-zero reported reserve, which needs sanity checking before any RALPH use.
- `WETH / USDC 0.01%` on Uniswap V3: about `$3.1M` volume, `$650k` reserve.
- `USDT / USDC` appears across Pancake Infinity, Uniswap V4, and Solidly V3.

Triage read: Base is excellent for testing RALPH's latency/freshness harness under high activity, but probably worse as a lower-competition edge source. It should be a control chain unless item 4 finds follower-token pair overlap that is active but not hyper-efficient.

### Mantle

DefiLlama top chain-volume venues in the probe:

- Fluxion Network: about `$9.9M`.
- Agni Finance: about `$242k`.
- Merchant Moe Liquidity Book: about `$37k`.
- Merchant Moe DEX: about `$5k`.
- Uniswap V3 and other legacy venues are tiny.

GeckoTerminal first-page pool evidence:

- `KII / USDT0 0.3%` on Fluxion: about `$9.1M` 24h volume, `$387k` reserve.
- `USDT0 / WMNT 0.25%` on Agni: about `$184k`, `$3.7M` reserve.
- `USDT0 / WMNT` on Merchant Moe LB: about `$19k`, `$4.9M` reserve.
- `WETH / WMNT` on Merchant Moe LB: about `$4k`, `$26k` reserve.
- Several repo-relevant Merchant Moe/Agni pairs have low current volume despite nontrivial reserves.

Triage read: Mantle remains useful because RALPH has repo-specific code and addresses, but it is not a broad first target. The old `WMNT/WETH` thesis looks weak on current volume. The only Mantle reason to continue early is a cheap check around `USDT0/WMNT` venue overlap or a Fluxion-specific pair if quote access can be mapped.

## Candidate Kill-Test Order

1. **Avalanche `WAVAX/USDC` pair family**
   - Venues to map first: Pharaoh V3/DLMM, Uniswap V3, Blackhole V3, Trader Joe LB, maybe Pangolin.
   - Reason: same pair appears across multiple venues, with enough 24h volume and reserve to test executable quote survival.
   - Caveat: stable/native majors may be efficiently arbitraged; success is not expected, but failure is high-information.

2. **Avalanche `WETH.e/WAVAX` pair family**
   - Venues to map first: Pharaoh V3, Uniswap V3, possibly Joe/Pangolin if overlap exists.
   - Reason: active enough to test non-stable pair behavior and factor sensitivity.
   - Caveat: wrapped bridge token dynamics need careful cost/stale-state treatment.

3. **Base control sample**
   - Start with one major pair and one follower-token/high-activity pool family only after item 4 filters suspicious low-reserve pools.
   - Reason: tests latency/freshness under active L2 conditions and Base Flashblocks HTTP behavior.
   - Caveat: not a lower-competition survival lane by default.

4. **Mantle niche recheck**
   - Start with `USDT0/WMNT` overlap, not `WMNT/WETH`, unless current pool depth changes.
   - Reason: preserves repo-specific learning without pretending the old Merchant Moe/Agni assumption is enough.

## BTC-First / Factor Caveats Preserved

This triage only selects where to measure. It does not define a tradable signal.

Every later sample still needs:

- BTC global regime first;
- ETH/major confirmation or divergence;
- ecosystem/sector leader context;
- follower-token lag/residual movement;
- then DEX venue discrepancy survival after full costs and latency.

Leader/follower relationships remain empirical tendencies, not laws. BTC usually dominates broad market beta, but ETH/majors may lag or diverge, ecosystem leaders may or may not transmit to smaller tokens, and BTC itself can be influenced by other markets. Those caveats belong in the measurement record, not in a narrative after the fact.

## Backlog Implication

Backlog item 3 is complete enough to move to item 4, **Pair-first overlap map**. That item should verify exact pair/venue overlap and contract/quoter paths before any executable-spread kill test is run.
