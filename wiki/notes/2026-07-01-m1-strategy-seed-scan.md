---
type: note
name: M1 Strategy Seed Scan
sources:
  - https://www.freqtrade.io/en/stable/
  - https://hummingbot.org/docs/
  - https://jesse.trade/
  - https://github.com/braedonsaunders/homerun
  - https://nautilustrader.io/
  - https://vectorbt.dev/
  - https://hotpath.rs/blog/revm-alloy-anvil-arbitrage
  - https://github.com/bluealloy/revm
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - core/operating-thesis.md
  - loops/strategy-research-loop.md
  - loops/framework-repo-discovery-loop.md
created: 2026-07-01T07:05:00Z
last_updated: 2026-07-01T07:05:00Z
---

# M1 Strategy Seed Scan

This is the first A1 seed scan for M1. It is not deep research yet. It creates a starting map for the next discovery loop.

## Working Strategy Families

| Family | Edge Type | Small-Budget Fit | First Verdict |
| --- | --- | --- | --- |
| Event-triggered wallet-shadow | information + event timing | possible | Candidate, but must falsify delay/sequencer assumptions |
| CEX trend/mean-reversion with on-chain filter | statistical + information | possible | Candidate for Freqtrade/Jesse style backtest |
| Volatility regime switching | statistical + event timing | possible | Candidate for research, not execution |
| DeFi position/risk monitoring | builder tool | high | Portfolio-fit candidate, not direct trading |
| Liquidation monitoring | structural | medium | Research-only until competition/capital known |
| Prediction market event systems | information + microstructure | low-current-trust | Watch, not default |
| DEX arb / sandwich / speed MEV | speed + ordering | poor | Likely discard for current budget |
| Market making | inventory + microstructure | medium/low | Study architecture, do not run |
| New-chain scout | information + early liquidity | medium | Watch only |
| Funding/perp basis | statistical + market structure | possible | Needs CEX data/backtest rail |

## Framework / Repo Shortlist

| Tool | What It Teaches | RALPH Use |
| --- | --- | --- |
| [Freqtrade](https://www.freqtrade.io/en/stable/) | Python strategy lifecycle, backtesting, dry-run, plotting, optimization | Good first CEX/backtest rail for low-cost strategy testing |
| [Hummingbot](https://hummingbot.org/docs/) | Modular connectors, market-making / algo bot architecture | Study architecture; later paper-only |
| [Jesse](https://jesse.trade/) | Python research/backtest/live framework with strategy focus | Candidate for clean strategy experiments |
| [Homerun](https://github.com/braedonsaunders/homerun) | Prediction-market strategy lifecycle, L2 book backtests, shadow mode | Reference architecture, not primary direction |
| [NautilusTrader](https://nautilustrader.io/) | Event-driven engine, backtesting/live parity, message bus style | Strong architecture reference; may be heavy |
| [vectorbt](https://vectorbt.dev/) | Fast vectorized backtesting over many parameter combinations | Useful for cheap research sweeps |
| [REVM/Anvil/Alloy tutorial](https://hotpath.rs/blog/revm-alloy-anvil-arbitrage) | EVM simulation pattern for MEV/arbitrage research | Useful for simulation rail design |
| [revm](https://github.com/bluealloy/revm) | Rust EVM implementation | Deeper simulation component, not first build |

## First Design Takeaways

- RALPH should separate three stages: research/backtest, shadow/simulation, execution.
- Freqtrade/Jesse/vectorbt are better first learning rails than Solana or MEV execution.
- NautilusTrader is worth studying for system architecture because it models cache, message bus, portfolio, actors, strategies, execution algorithms, and backtest engine.
- Homerun is useful as a reference for signal source -> strategy -> backtest -> shadow mode -> live guardrail lifecycle, even if Polymarket is not primary.
- REVM/Anvil/Alloy matters if a candidate needs EVM simulation, but it should not become the first project unless a strategy demands it.

## Next Loop Tasks

1. Build a deeper repo/framework comparison: Freqtrade vs Jesse vs vectorbt vs NautilusTrader vs Hummingbot vs Homerun.
2. Build a strategy-family taxonomy with requirements: data, infra, capital, latency, simulation, failure modes.
3. Draft the event-triggered wallet-shadow falsification checklist.
4. Identify which strategy family can produce a no-key, no-account, no-paid-infra first experiment.

