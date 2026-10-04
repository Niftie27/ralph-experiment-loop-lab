---
type: research-note
created: 2026-10-04T12:35:00Z
topic: volume-velocity-flashloan-arb
status: proposed-measurement-lane
work_item: investigation.volume-velocity-flashloan-arb-survival
tags:
  - ralph
  - research-only
  - arbitrage
  - flashloan
  - volume-velocity
  - dex
  - mev
  - no-live-trading
  - no-execution
related:
  - 2026-08-26-velocity-replay-adapter-feasibility.md
  - 2026-08-30-public-free-source-feed-list.md
  - 2026-08-30-strategy-family-taxonomy.md
  - 2026-09-28-historical-orderflow-data-rails.md
  - 2026-10-03-market-bot-reverse-engineering-backlog.md
sources:
  - https://collective.flashbots.net/t/to-wait-or-to-probe-arbitrage-competition-on-high-throughput-blockchains/5759
  - https://www.usenix.org/conference/usenixsecurity23/presentation/mclaughlin
  - https://docs.jito.wtf/lowlatencytxnsend/
  - https://cdn.arenafi.org/papers/arxiv/2501.17335.pdf
---
# Volume Velocity Flashloan-Arb Survival Lane

Tomas proposed that sudden volume-velocity bursts in midcaps and lower caps may create temporary DEX price fragmentation that is useful for flashloan-arbitrage discovery.

## Working Thesis

Volume velocity does not create the arbitrage. It may identify stress windows where arbitrage is more likely because liquidity fragments, AMM prices lag, routes imbalance, or CEX/DEX and DEX/DEX venues update at different speeds.

The core question is not whether a visible price difference exists. The core question is whether the spread survives long enough, and deeply enough, to be captured after DEX fees, flashloan fees, gas, priority tips/bribes, slippage, failed transaction cost, and MEV competition.

## Important Observation

For midcaps and lower caps during sudden pumps, gross DEX price differences can persist for multiple blocks and sometimes seconds to minutes, especially when liquidity is thin or fragmented. The actually executable profit window can be much shorter once depth, slippage, gas, and competing searchers are modeled.

For majors and obvious same-chain DEX-to-DEX routes, assume one-block or sub-block competition until measured otherwise.

## Backtest Question

Can RALPH identify historical windows where:

1. a volume-velocity burst occurred;
2. DEX pool prices or route quotes diverged across venues;
3. a same-chain atomic route was profitable after realistic costs;
4. the opportunity survived for measurable blocks/slots or wall-clock time;
5. the required infrastructure speed is feasible for Tomas's budget and operating model?

## Proposed Measurement Design

Build this first as an offline survival study, not an execution bot.

Inputs:

- volume-velocity event windows from existing watcher/paper/demo artifacts;
- CEX trade/ticker reference where available;
- DEX pool swap/reserve events around each event window;
- pool metadata: chain, token, pair, fee tier, liquidity, TVL, venue;
- gas and priority-fee context for the block/slot;
- route simulation output for same-chain atomic paths.

Outputs:

- `first_profitable_seen_at`;
- `last_profitable_seen_at`;
- `gap_lifetime_blocks`;
- `gap_lifetime_seconds`;
- `max_net_profit_after_costs`;
- `depth_at_profit`;
- `min_required_reaction_time`;
- `failure_reasons`: slippage, gas/tip, stale quote, insufficient liquidity, non-atomic route, route already closed, MEV risk.

## Infra-Speed Classification

Use measured opportunity survival to classify the needed infra:

- `OFFLINE_ONLY`: interesting historically, but not durable enough or profitable enough.
- `SLOW_WATCHER`: opportunity survives minutes; a normal API watcher may be enough for alerts/research, not necessarily execution.
- `FAST_WATCHER`: opportunity survives seconds to tens of seconds; needs low-latency polling/streaming and rapid simulation, but not necessarily colocated searcher infra.
- `BLOCK_RACE`: opportunity is one-block/sub-block; requires private relay/bundle path, fast simulation, robust nonce/tx handling, and high operational maturity.
- `NOT_ATOMIC`: only exists cross-chain or across venues where flashloan execution cannot settle atomically; requires inventory, not pure flashloan.

## Where This Should Live

This belongs inside RALPH as a research/measurement lane:

- `wiki/notes/` for this thesis and decisions;
- `case-files/` for old trading-bot-ish repos and lessons;
- `experiments/velocity-arb-survival/` if approved for implementation;
- `automation/work-queues.yaml` only after a bounded first measurement task is accepted;
- `execution-adapters/` should remain absent or disabled unless Tomas explicitly approves execution policy later.

Do not merge old trading-bot repositories directly into a production bot. First import them as evidence, case files, or adapters to be measured against this survival framework.

## Initial Verdict

Directionally promising as a measurement lane. Not yet a strategy candidate and not yet an execution project.

The first useful branch should answer: during real volume-velocity bursts, how often do same-chain DEX routes show a positive net route, how long does that positive route survive, and what minimum infra speed would have been required?

## Boundary

No wallet keys, exchange accounts, paid APIs, live orders, flashloan contracts, deployment, cron, watcher behavior, or alert wording changed. This is research-only until survival data justifies a separate proposal.
