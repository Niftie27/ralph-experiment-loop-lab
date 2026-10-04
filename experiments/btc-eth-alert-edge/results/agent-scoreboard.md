# RALPH Agent Swarm Research

Generated: 2026-08-22T06:00:58.151Z

Status: research-only, no live execution. This file scores specialist research agents against finalized alert outcomes; it does not alter alerts, thresholds, risk, sizing, keys, accounts, wallets, or execution.

## Dataset

- Joined finalized alert rows: 73
- Clean rows: 13
- Tainted rows: 60
- Label rule: follow if 1h directional move is >= 0.15%, fade if <= -0.15%, otherwise noisy.
- Label counts: noisy 12, fade 31, follow 30
- Relative alignment: confirmed 29, mixed 24, contradicted 20
- Quality flags: book_not_fresh 54, negative_book_age 6, score_above_max 1
- Grouped scoreboard slices: 20

## Agent Scoreboard

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 42.5% | 31 | 42 | 0 | learning |
| book_pressure_scout | liquidity-scout | 26.0% | 42.1% | 8 | 11 | 54 | learning |
| trigger_follow_scout | market-scout | 100.0% | 41.1% | 30 | 43 | 0 | inverted/weak |
| wick_exhaustion_scout | trigger-specialist | 50.7% | 40.5% | 15 | 22 | 36 | inverted/weak |
| relative_strength_scout | relative-matrix-scout | 100.0% | 35.6% | 26 | 47 | 0 | inverted/weak |
| multi_source_follow_scout | ensemble-agent | 100.0% | 34.3% | 25 | 48 | 0 | inverted/weak |
| cvd_confirmation_scout | orderflow-scout | 98.6% | 33.3% | 24 | 48 | 1 | inverted/weak |
| clean_book_relative_scout | ensemble-agent | 17.8% | 30.8% | 4 | 9 | 60 | learning |

## Interpretation

The swarm is intentionally measurable: scouts make simple predictions, ensemble agents test combinations, the critic abstains on tainted data, and grouped scoreboards show where agents work or fail. Treat high scores as candidates for deeper validation, not live gates.

## Outputs

- `results/agent-swarm-feature-table.json`
- `results/agent-swarm-feature-table.csv`
- `results/agent-scoreboard.json`
- `results/agent-scoreboard-slices.json`
- `results/agent-scoreboard-slices.md`
