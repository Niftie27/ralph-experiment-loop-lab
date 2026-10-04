---
type: note
name: Trading Bot Build Guide Map
sources:
  - https://www.freqtrade.io/en/stable/strategy-101/
  - https://www.freqtrade.io/en/stable/strategy-customization/
  - https://hummingbot.org/docs/
  - https://nautilustrader.io/docs/latest/concepts/architecture/
  - https://nautilustrader.io/docs/latest/concepts/backtesting/
  - https://nautilustrader.io/docs/latest/concepts/overview/
  - https://jesse.trade/
tags:
  - ralph
  - research-note
  - misc-research
related:
  - core/testing-protocol.md
  - core/operating-thesis.md
  - wiki/notes/2026-07-01-m1-strategy-seed-scan.md
created: 2026-07-01T07:15:00Z
last_updated: 2026-07-01T07:15:00Z
---

# Trading Bot Build Guide Map

There is no single trustworthy guidebook RALPH should blindly follow. The safer approach is a composite playbook:

1. Use framework docs to understand lifecycle and constraints.
2. Use public repos to understand architecture patterns.
3. Use failure cases to avoid false confidence.
4. Use RALPH stage gates to decide what to test next.

## Useful Guide Sources

| Source | Useful Lesson | RALPH Interpretation |
| --- | --- | --- |
| Freqtrade strategy docs | Strategy can move through backtest, hyperopt, dry/forward test, live, and FreqAI modes. Docs explicitly say to use dry mode before risking capital. | Good guide for staged testing discipline. |
| Freqtrade strategy quickstart | Backtesting assumes fills; dry-run can diverge because real orders may not fill or may be delayed. | RALPH must never trust backtest-only results. |
| Hummingbot docs | Strategy logic and private config are separated; strategies automate algo logic based on config. | Good architecture pattern, but may be capital/market-making biased. Needs falsification. |
| NautilusTrader architecture docs | Event-driven trading systems have components like cache, message bus, portfolio, actors, strategies, execution algorithms, and backtest/live contexts. | Strong source for operations map, even if too heavy to use now. |
| NautilusTrader backtesting docs | Backtesting simulates a full system implementation, not just a signal formula. | Good model for RALPH's eventual operation sequencing. |
| Jesse | Focuses on crypto strategy backtests, paper/live tooling, benchmark feature, and strategy workflow. | Candidate for low-cost strategy exploration, but pricing/features need scrutiny. |

## RALPH Composite Build Process

1. Strategy hypothesis.
2. Evidence review.
3. Offline backtest/replay.
4. Forward paper/shadow.
5. No-key prototype design.
6. Human approval gate.
7. Only much later, execution discussion.

## Immediate Conclusion

Hummingbot is not accepted as a good fit. It is only a source to test. Tomas's concern that Hummingbot may favor larger-capital market-making is a valid falsification point.

> Synthesis: RALPH should not ask "which framework should we use?" yet. It should ask "which guide source teaches the safest next test for this specific strategy family?"

