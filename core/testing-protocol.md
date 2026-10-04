# RALPH Testing Protocol

RALPH tests ideas by reducing uncertainty in stages. The goal is not to prove a profitable bot quickly. The goal is to avoid building the wrong system.

Standing operating loop from Tomas: run your own statistics, then Verify/Reassess. If a direct route fails, find another route before giving up: existing tools, MCP/tool discovery, public APIs, local cache, smaller proxy tests, or a documented blocked state.

## Stage Gates

### T0 — Strategy Hypothesis

Question: what edge is being claimed?

Required output:

- strategy family
- edge type
- market/venue
- required capital
- required infra
- data needed
- why it might fit Tomas's budget
- what would falsify it

No code required.

### T1 — Evidence Review

Question: is there enough external evidence to justify a test?

Required output:

- at least 3 independent sources or repos
- prior-art/wheel scan: existing datasets, frameworks, public notebooks/repos, papers, dashboards, and APIs that already solve or shrink the proposed work
- reuse decision: use existing, adapt existing, benchmark against existing, or custom-build with an explicit exception
- known failure modes
- competition / latency / capital risks
- comparable public examples
- RALPH score
- Verify/Reassess note: what was checked, what changed, and whether confidence went up or down

Decision: discard, watch, investigate, or benchmark.

### T2 — Offline Backtest Or Replay

Question: does the idea survive historical data?

Entry rule: T2 cannot expand into custom data collection or engine work until T1 names why existing public datasets/frameworks are insufficient.

Exit rule: T2 output must include both statistics and reassessment. At minimum: sample count, winrate, expectancy, baseline comparison, known data/fill assumptions, and what would invalidate the result.

Strategy-filter extension: when a run tests many variants or parameter combinations, headline Sharpe is not enough. T2 should include a multiple-testing penalty such as deflated Sharpe or a clearly labeled proxy, plus failure slices that can reject a strategy even when aggregate results look acceptable.

Allowed rails:

- local CSV/parquet data
- public/free APIs
- Freqtrade/Jesse/vectorbt/Nautilus backtest modes
- REVM/Anvil-style simulation only if the strategy requires EVM state replay

Forbidden:

- live keys
- exchange account setup
- paid data without approval
- live orders

### T3 — Forward Paper / Shadow

Question: does the idea survive real-time delays and missing fills?

This is paper-only. The point is to compare backtest assumptions with live market conditions.

Important lesson from Freqtrade docs: backtests can assume fills that dry-run cannot, so dry-run/forward testing is required before trusting a backtest.

### T4 — Prototype Design

Question: would a no-key, no-live prototype be worth building?

Required:

- T2/T3 result memo
- expected operating cost
- failure mode checklist
- explicit Tomas approval

### T5 — Execution Discussion

Out of scope for current RALPH.

## What RALPH Can Do Alone

- Search and summarize public sources.
- Score strategy families.
- Compare frameworks and repos.
- Draft benchmark plans.
- Run local read-only analysis over existing data.
- Run its own paper/statistical measurements over public/free data and local alert history.
- Maintain queues, unknowns, candidates, decisions, and discards.
- Propose skills/rules after repeated failures or successes.

## What Requires Tomas

- Any recurring automation activation.
- Paid APIs or paid infra.
- Account creation.
- Public publishing.
- Large repo changes.
- Anything involving keys, wallets, exchange accounts, or live trading.
