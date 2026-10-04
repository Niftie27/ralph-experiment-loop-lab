---
type: note
name: Framework Shortlist Wheel Gate
created: 2026-08-28T05:42:00Z
last_updated: 2026-08-28T05:42:00Z
tags:
  - autoresearch
  - framework-discovery
  - strategy-destruction-filter
  - no-key
sources:
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/backtesting/
  - https://nautilustrader.io/docs/latest/
  - https://github.com/polakowo/vectorbt
  - https://vectorbt.dev/
  - https://jesse.trade/
related:
  - ../../loops/framework-repo-discovery-loop.md
  - ./2026-07-01-trading-bot-build-guide-map.md
  - ../../decisions/candidates.md
  - ../../automation/work-queues.yaml
---

# Framework Shortlist Wheel Gate

Status: bounded source-backed shortlist for future strategy-filter tooling, not an implementation decision.

## Question

Before expanding custom strategy-destruction-filter tooling, which existing no-key or public-doc frameworks should RALPH reuse, benchmark against, or keep on watch?

## Access Check

Local package/binary check on 2026-08-28 found `freqtrade`, `vectorbt`, `nautilus_trader`, and `jesse` are not installed in the workspace. Public docs/repos are reachable, so these are source-backed reuse candidates, not active local dependencies. Any install, framework setup, dry-run account, exchange integration, or testnet key still needs a separate explicit approval if it exceeds local no-key research.

## Shortlist

| Framework | What existing source claims | RALPH fit | Status |
| --- | --- | --- | --- |
| Freqtrade | Docs expose staged backtesting/dry-run discipline and specific lookahead/recursive-bias checks. Backtesting docs warn that backtesting does not replace dry-run and that unavailable future data can pollute tests. | Best immediate benchmark for validation hygiene: lookahead checks, recursive-bias checks, dry-run-before-risk framing. | Candidate benchmark; not installed. |
| vectorbt | Open-source community edition focuses on fast vectorized pandas/NumPy backtesting and broad parameter sweeps. | Good fit for cheap parameter-sweep falsification, but vectorized speed can amplify overfit unless paired with RALPH OOS/baseline/DS gates. | Candidate research rail; not installed. |
| NautilusTrader | Docs describe event-driven architecture, backtesting, data-loading contracts, post-run analysis, and live-trading recovery. | Strong architecture reference for realistic event/replay boundaries; probably too heavy for a micro-run strategy sieve. | Watch/reference; not installed. |
| Jesse | Public site presents crypto-focused strategy research, backtests, paper trading, and live modes. | Useful crypto-specific comparison point, but less directly useful than Freqtrade/vectorbt for the current strict-filter hardening path. | Watch; not installed. |

## Wheel-Gate Verdict

Do not expand custom strategy-filter implementation until the next concrete need is classified:

- Bias and staged validation guard: compare against Freqtrade docs first.
- Large parameter-sweep kill tests: test whether vectorbt can run the same candidate-family sweep locally before custom expansion.
- Event/replay realism: use NautilusTrader as an architecture benchmark before building another replay engine.
- Crypto bot workflow examples: keep Jesse as a secondary workflow reference.

Current strategy-destruction-filter remains the active local harness because it already contains Tomas-specific gates: out-of-sample split, baseline comparison, deflated-Sharpe proxy, walk-forward invariant, and semantic rejection ledger. Frameworks should inform or benchmark the harness before replacing it.

## Verify And Reassess

This run used four web/source checks plus one local package/binary check. It found no installed framework and no reason to promote any tool to active use. The highest-value next bounded step is `discovery.freqtrade-no-key-dry-run-spike`: verify whether Freqtrade can be used locally as a no-key validation benchmark for one existing candidate family, without exchange credentials or live/dry-run account setup.

Self-check: research-only; public/free docs and GitHub page only; no package installs; no API keys; no accounts; no paid access; no execution, orders, wallet keys, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, or strategy promotion changed.
