---
title: Arbitrage Bot Repo Depth Audit
date: 2026-10-04
status: audit
tags:
  - ralph
  - repo-audit
  - dex-discrepancy
  - arbitrage
  - factor-trigger
---

# Arbitrage Bot Repo Depth Audit

Source repo audited: `/home/coder/.openclaw/workspace/trading-bot-repo-intake/arbitrage_bot`.

Scope: backlog item 1 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]: audit `chain-logger`, Mantle scripts, and execution boundaries deeply enough to separate reusable measurement ideas from demo or unsafe code.

## Verdict

Reusable for RALPH: the **measurement skeleton**, not the bot.

The best asset remains `chain-logger/spread-logger.js`: a small CommonJS executable-quote sampler with chain JSON configs, quoter abstractions for V2/V3/Algebra/LB, per-notional round-trip records, and a kill/promote discipline. It is not production-grade for RALPH's current question because it lacks quote latency timestamps, stale-state accounting, BTC/ETH/leader factor labels, dynamic gas/priority/bribe/failure costs, and true block/event persistence.

Mantle scripts are useful mostly as **kill-test examples**. They show how the previous repo moved from mid-price suspicion to executable quote/slippage/liquidity checks on Merchant Moe LB vs Agni V3. They should not be imported as a live strategy or execution base.

## Reusable vs Demo Evidence Table

| Component | Evidence | Reuse class | RALPH decision |
|---|---|---:|---|
| `chain-logger/README.md` | Defines chain-agnostic spread logging, custom RPC overrides, config-based chain addition, supported V2/V3/Algebra/LB quoter types, JSONL output, and kill/promote thresholds (`README.md:1-63`). | Reusable design | Keep the shape: small read-only logger, JSONL samples, chain configs, kill/extend/promote summaries. |
| `chain-logger/CHAIN_TESTING_PLAYBOOK.md` | Enforces chain triage by DEX volume, DEX count, pair overlap, AMM diversity, and WebSocket RPC (`CHAIN_TESTING_PLAYBOOK.md:11-25`); promotes only after executable positive spreads (`CHAIN_TESTING_PLAYBOOK.md:67-96`); forbids mid-price-only decisions (`CHAIN_TESTING_PLAYBOOK.md:195-203`). | Reusable discipline | Keep the falsification discipline, but update stale chain priorities and add access/cost/freshness fields before using any list. |
| `chain-logger/spread-logger.js` quoter layer | Implements V3 `quoteExactInputSingle`, Algebra V1/V2 detection, V2 `getAmountsOut`, and LB `findBestPathFromAmountIn` (`spread-logger.js:61-230`). | Reusable with rewrite | Reuse as reference for RALPH's quoter adapter API. Do not paste wholesale; RALPH should add per-call timestamps, provider identity, block lag, and structured errors. |
| `chain-logger/spread-logger.js` round-trip logic | Computes token0 -> token1 on one venue, then token1 -> token0 on another venue, by notional (`spread-logger.js:296-348`). | Reusable core idea | Keep executable round-trip quoting. Add DEX fees, price impact, gas/base fee, priority/bribe proxy, simulation/revert budget, stale drift, and MEV competition classification before any "positive" label. |
| `chain-logger/spread-logger.js` persistence logic | Counts repeated polling observations as persistence when spread exceeds 0.3% (`spread-logger.js:354-378`) and summarizes every 10/60 cycles (`spread-logger.js:563-586`). | Demo quality | Do not use as evidence of block persistence. It is polling persistence, not same-block/sub-block survival. Replace with block-tagged, quote-start/end, and delay-bucket survival logic. |
| `chain-logger/spread-logger.js` output | Writes JSONL with timestamp, block, chain, pair, direction, notional, spread/net pct, net USD (`spread-logger.js:539-548`). | Reusable schema seed | Extend the record, do not shrink it: include factor trigger, BTC gate, ETH/major state, leader/follower universe, quote timings, provider, stale block lag, route errors, and full cost fields. |
| Chain config files | Avalanche config has public RPC, token set, TraderJoe LB/Pangolin V2/Uniswap V3 venues and multiple overlapping pairs (`avalanche.json:1-155`); Arbitrum and Sonic configs provide baseline/control ideas. | Reusable examples | Treat as examples only. Chain/pair lists are stale until current venue volume, pair overlap, RPC access, and notional depth are re-verified. |
| Mantle `config.json` | Contains Mantle public HTTP/WS RPC, pair universe, Merchant Moe/Agni addresses, fixed gas and trade-size constants (`config.json:14-35`, `config.json:48-126`). | Partly reusable data | Addresses and pair list are useful seed material for Mantle-specific recheck. Fixed costs and old pair assumptions are not evidence. |
| `bot.js` Mantle monitor | HTTP block polling, initializes configured pairs, calculates Merchant Moe vs Agni mid-price, logs paper profit after fixed gas (`bot.js:1-5`, `bot.js:81-195`). | Demo / caution | Do not reuse for RALPH signals. It is mid-price/paper-profit monitoring, not executable quote survival, and has no BTC/factor gate. |
| `research/historical-spreads.js` | Reconstructs historical LB/V3 mid-price spreads with `blockTag`, checks archive access, samples every N blocks, ranks spread distributions, and estimates paper P&L (`historical-spreads.js:1-35`, `historical-spreads.js:78-96`, `historical-spreads.js:261-354`, `historical-spreads.js:357-527`). | Research pattern, not proof | Reuse the archive-access check, resumable JSONL, and distribution reporting. Do not treat mid-price spreads or `$2k size, $0.05 gas` paper P&L as executable evidence. |
| `research/slippage-simulator.js` | Simulates both directions using Agni QuoterV2 and Merchant Moe `getSwapOut`, sizes `$100-$5000`, gas, flash fee, and safety buffer (`slippage-simulator.js:1-20`, `slippage-simulator.js:37-42`, `slippage-simulator.js:284-441`). | Reusable kill-test pattern | Good model for turning a suspected spread into an executable quote/slippage kill test. Needs dynamic costs, timing, provider freshness, and factor labels. |
| `scripts/check-agni-depth.js` | Scans Agni fee tiers and intermediary routing pools, then Merchant Moe WMNT/WETH depth (`check-agni-depth.js:31-113`). | Reusable diagnostic | Keep as a pattern for pool-depth sanity checks before quote logging. Replace crude static USD prices with current price sources or quote-derived valuations. |
| `scripts/scan-mantle-dexes.js` | Scans Agni, FusionX, iZiSwap, Butter, Cleopatra, and Merchant Moe pool depth for WMNT/WETH and key pairs; verdict kills WMNT/WETH if no deep non-MM pool exists (`scan-mantle-dexes.js:19-61`, `scan-mantle-dexes.js:176-221`). | Reusable triage pattern | Good pair/venue overlap diagnostic. Generalize into RALPH chain/venue triage, but avoid hardcoded WMNT/WETH and stale `$0.6/$2700` valuations. |
| `contracts/Arbitrage.sol` | Executes Balancer flash loan, two V3 swaps, repays, and transfers profit to owner (`Arbitrage.sol:24-90`); no owner guard on `executeTrade`; assumes same fee for both swaps; `amountOutMinimum` is `0` on first leg (`Arbitrage.sol:24-43`, `Arbitrage.sol:61-79`, `Arbitrage.sol:94-120`). | Unsafe / out of scope | Do not import. Execution remains explicitly out of scope until read-only evidence survives the full RALPH gate and Tomas approves execution policy. |
| README / root Hardhat path | README asks for `PRIVATE_KEY`, Alchemy key, Hardhat deploy, and optional flash-loan execution (`README.md:44-68`, `README.md:110-140`, `README.md:194-207`). | Demo / hazardous | Keep out of survival lane. No keys, no deployment, no funded account, no infra purchase. |

## RALPH Reuse Contract

If RALPH later implements a measurement harness from this repo, it should copy the **interface shape**, not the files:

- config-driven chain/pair/venue definitions;
- read-only quote adapters for V2, V3, Algebra, and Liquidity Book;
- JSONL raw samples plus summary verdicts;
- executable round-trip quote first, mid-price only as context;
- pool-depth sanity checks before quote tests;
- kill/extend/promote decisions that require post-cost recurring spreads.

Required upgrades before any RALPH experiment:

- BTC-first gate on every sample: `BTC_RISK_ON`, `BTC_RISK_OFF`, `BTC_TRANSITION`, or `BTC_STALE`.
- Factor trigger labels: BTC, ETH/majors, ecosystem or sector leader, follower token, then DEX venue discrepancy.
- Empirical caveat fields: leader/follower relationships are tendencies, not laws; ETH/majors may lag/diverge; leader influence depends on cap/strength; BTC itself can be influenced by other markets.
- Quote timing: local event time, quote start/end per venue, RPC/provider identity, block number, block timestamp, block lag, and error class.
- Delay buckets: same block, next block, 0.5s, 1s, 2s, 5s, next 2 blocks.
- Full cost stack: DEX fees, price impact, gas/base fee, priority tip/bribe/bundle proxy, flashloan fee if modeled, failed simulation/revert budget, stale quote drift, and MEV/searcher competition.
- Strict read-only boundary: no private keys, no deployment, no flashloan contract, no bundle submission.

## Backlog Implication

Backlog item 1 is complete enough to move next to **Zela replacement / infra access map** and **chain/venue triage**. The repo does not justify building `volume_velocity_dex_discrepancy_event_study` yet. First prove accessible infrastructure can collect fresh executable quotes on a currently credible chain/pair universe.
