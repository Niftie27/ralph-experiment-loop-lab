# RALPH Agent Scoreboard Slices

Generated: 2026-08-22T06:00:58.151Z

Status: research-only, no live execution.

Grouped scoreboards expose where scouts work or fail by asset, trigger, direction, quality state, relative alignment, and beta bucket. Slices below require at least five rows.

### dataQuality: tainted

Rows: 60. Labels: noisy 11, fade 22, follow 27.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| book_pressure_scout | liquidity-scout | 10.0% | 50.0% | 3 | 3 | 54 | learning |
| trigger_follow_scout | market-scout | 100.0% | 45.0% | 27 | 33 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 51.7% | 41.9% | 13 | 18 | 29 | inverted/weak |
| velocity_continuation_scout | trigger-specialist | 48.3% | 37.9% | 11 | 18 | 31 | inverted/weak |
| cvd_confirmation_scout | orderflow-scout | 98.3% | 37.3% | 22 | 37 | 1 | inverted/weak |

### asset: ETH

Rows: 38. Labels: noisy 7, fade 19, follow 12.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 50.0% | 19 | 19 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 36.8% | 50.0% | 7 | 7 | 24 | learning |
| book_pressure_scout | liquidity-scout | 26.3% | 50.0% | 5 | 5 | 28 | learning |
| clean_book_relative_scout | ensemble-agent | 18.4% | 42.9% | 3 | 4 | 31 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 34.2% | 13 | 25 | 0 | inverted/weak |

### direction: UP

Rows: 38. Labels: fade 12, follow 19, noisy 7.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_follow_scout | market-scout | 100.0% | 50.0% | 19 | 19 | 0 | learning |
| book_pressure_scout | liquidity-scout | 15.8% | 50.0% | 3 | 3 | 32 | learning |
| wick_exhaustion_scout | trigger-specialist | 52.6% | 45.0% | 9 | 11 | 18 | learning |
| velocity_continuation_scout | trigger-specialist | 47.4% | 44.4% | 8 | 10 | 20 | learning |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 42.1% | 16 | 22 | 0 | learning |

### trigger: WICK:5s

Rows: 37. Labels: follow 18, noisy 5, fade 14.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| risk_quality_critic | review-agent | 16.2% | 50.0% | 3 | 3 | 31 | learning |
| trigger_follow_scout | market-scout | 100.0% | 48.6% | 18 | 19 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 100.0% | 40.5% | 15 | 22 | 0 | inverted/weak |
| trigger_fade_scout | strategy-agent | 100.0% | 37.8% | 14 | 23 | 0 | inverted/weak |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 37.8% | 14 | 23 | 0 | inverted/weak |

### triggerKind: WICK

Rows: 37. Labels: follow 18, noisy 5, fade 14.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| risk_quality_critic | review-agent | 16.2% | 50.0% | 3 | 3 | 31 | learning |
| trigger_follow_scout | market-scout | 100.0% | 48.6% | 18 | 19 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 100.0% | 40.5% | 15 | 22 | 0 | inverted/weak |
| trigger_fade_scout | strategy-agent | 100.0% | 37.8% | 14 | 23 | 0 | inverted/weak |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 37.8% | 14 | 23 | 0 | inverted/weak |

### triggerKind: VELOCITY

Rows: 36. Labels: noisy 7, fade 17, follow 12.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| book_pressure_scout | liquidity-scout | 25.0% | 55.6% | 5 | 4 | 27 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 47.2% | 17 | 19 | 0 | learning |
| clean_book_relative_scout | ensemble-agent | 19.4% | 42.9% | 3 | 4 | 29 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 41.7% | 15 | 21 | 0 | inverted/weak |
| trigger_follow_scout | market-scout | 100.0% | 33.3% | 12 | 24 | 0 | inverted/weak |

### direction: DOWN

Rows: 35. Labels: noisy 5, fade 19, follow 11.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 54.3% | 19 | 16 | 0 | learning |
| book_pressure_scout | liquidity-scout | 37.1% | 38.5% | 5 | 8 | 22 | learning |
| wick_exhaustion_scout | trigger-specialist | 48.6% | 35.3% | 6 | 11 | 18 | learning |
| trigger_follow_scout | market-scout | 100.0% | 31.4% | 11 | 24 | 0 | inverted/weak |
| relative_strength_scout | relative-matrix-scout | 100.0% | 28.6% | 10 | 25 | 0 | inverted/weak |

### relativeAlignment: confirmed

Rows: 29. Labels: noisy 4, fade 11, follow 14.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| wick_exhaustion_scout | trigger-specialist | 44.8% | 53.8% | 7 | 6 | 16 | learning |
| trigger_follow_scout | market-scout | 100.0% | 48.3% | 14 | 15 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 48.3% | 14 | 15 | 0 | learning |
| multi_source_follow_scout | ensemble-agent | 100.0% | 44.8% | 13 | 16 | 0 | learning |
| risk_quality_critic | review-agent | 17.2% | 40.0% | 2 | 3 | 24 | learning |

### betaBucket: idiosyncratic-weakness

Rows: 24. Labels: noisy 5, follow 7, fade 12.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 50.0% | 12 | 12 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 50.0% | 50.0% | 6 | 6 | 12 | learning |
| book_pressure_scout | liquidity-scout | 37.5% | 44.4% | 4 | 5 | 15 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 33.3% | 8 | 16 | 0 | inverted/weak |
| relative_contrarian_scout | review-agent | 100.0% | 33.3% | 8 | 16 | 0 | inverted/weak |

### relativeAlignment: mixed

Rows: 24. Labels: follow 10, noisy 3, fade 11.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| book_pressure_scout | liquidity-scout | 25.0% | 50.0% | 3 | 3 | 18 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 45.8% | 11 | 13 | 0 | learning |
| trigger_follow_scout | market-scout | 100.0% | 41.7% | 10 | 14 | 0 | inverted/weak |
| wick_exhaustion_scout | trigger-specialist | 50.0% | 41.7% | 5 | 7 | 12 | learning |
| velocity_continuation_scout | trigger-specialist | 50.0% | 33.3% | 4 | 8 | 12 | learning |

### betaBucket: cross-pair-divergence

Rows: 21. Labels: follow 13, noisy 3, fade 5.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_follow_scout | market-scout | 100.0% | 61.9% | 13 | 8 | 0 | watch |
| velocity_continuation_scout | trigger-specialist | 19.1% | 50.0% | 2 | 2 | 17 | learning |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 42.9% | 9 | 12 | 0 | learning |
| multi_source_follow_scout | ensemble-agent | 100.0% | 38.1% | 8 | 13 | 0 | inverted/weak |
| risk_quality_critic | review-agent | 28.6% | 33.3% | 2 | 4 | 15 | learning |

### betaBucket: idiosyncratic-strength

Rows: 21. Labels: fade 10, follow 8, noisy 3.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| wick_exhaustion_scout | trigger-specialist | 23.8% | 60.0% | 3 | 2 | 16 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 52.4% | 11 | 10 | 0 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 47.6% | 10 | 11 | 0 | learning |
| trigger_follow_scout | market-scout | 100.0% | 38.1% | 8 | 13 | 0 | inverted/weak |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 33.3% | 7 | 14 | 0 | inverted/weak |

### relativeAlignment: contradicted

Rows: 20. Labels: noisy 5, fade 9, follow 6.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| book_pressure_scout | liquidity-scout | 30.0% | 50.0% | 3 | 3 | 14 | learning |
| clean_book_relative_scout | ensemble-agent | 20.0% | 50.0% | 2 | 2 | 16 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 45.0% | 9 | 11 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 45.0% | 9 | 11 | 0 | learning |
| trigger_follow_scout | market-scout | 100.0% | 30.0% | 6 | 14 | 0 | inverted/weak |

### asset: BTC

Rows: 18. Labels: follow 10, noisy 4, fade 4.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| velocity_continuation_scout | trigger-specialist | 38.9% | 57.1% | 4 | 3 | 11 | learning |
| trigger_follow_scout | market-scout | 100.0% | 55.6% | 10 | 8 | 0 | learning |
| multi_source_follow_scout | ensemble-agent | 100.0% | 50.0% | 9 | 9 | 0 | learning |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 44.4% | 8 | 10 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 33.3% | 6 | 12 | 0 | learning |

### asset: SOL

Rows: 17. Labels: follow 8, fade 8, noisy 1.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_follow_scout | market-scout | 100.0% | 47.1% | 8 | 9 | 0 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 47.1% | 8 | 9 | 0 | learning |
| multi_source_follow_scout | ensemble-agent | 100.0% | 47.1% | 8 | 9 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 70.6% | 41.7% | 5 | 7 | 5 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 41.2% | 7 | 10 | 0 | learning |

### trigger: VELOCITY:5m

Rows: 14. Labels: fade 7, follow 6, noisy 1.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| book_pressure_scout | liquidity-scout | 28.6% | 75.0% | 3 | 1 | 10 | learning |
| clean_book_relative_scout | ensemble-agent | 21.4% | 66.7% | 2 | 1 | 11 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 50.0% | 7 | 7 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 50.0% | 7 | 7 | 0 | learning |
| trigger_follow_scout | market-scout | 100.0% | 42.9% | 6 | 8 | 0 | learning |

### dataQuality: clean

Rows: 13. Labels: noisy 1, follow 3, fade 9.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 69.2% | 9 | 4 | 0 | learning |
| book_pressure_scout | liquidity-scout | 100.0% | 38.5% | 5 | 8 | 0 | learning |
| wick_exhaustion_scout | trigger-specialist | 46.2% | 33.3% | 2 | 4 | 7 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 30.8% | 4 | 9 | 0 | learning |
| clean_book_relative_scout | ensemble-agent | 100.0% | 30.8% | 4 | 9 | 0 | learning |

### trigger: VELOCITY:60s

Rows: 12. Labels: noisy 3, fade 7, follow 2.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_fade_scout | strategy-agent | 100.0% | 58.3% | 7 | 5 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 41.7% | 5 | 7 | 0 | learning |
| multi_source_follow_scout | ensemble-agent | 100.0% | 33.3% | 4 | 8 | 0 | learning |
| velocity_continuation_scout | trigger-specialist | 100.0% | 25.0% | 3 | 9 | 0 | learning |
| relative_contrarian_scout | review-agent | 100.0% | 25.0% | 3 | 9 | 0 | learning |

### trigger: VELOCITY:15m

Rows: 10. Labels: follow 4, noisy 3, fade 3.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| trigger_follow_scout | market-scout | 100.0% | 40.0% | 4 | 6 | 0 | learning |
| velocity_continuation_scout | trigger-specialist | 100.0% | 40.0% | 4 | 6 | 0 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 30.0% | 3 | 7 | 0 | learning |
| cvd_confirmation_scout | orderflow-scout | 100.0% | 30.0% | 3 | 7 | 0 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 30.0% | 3 | 7 | 0 | learning |

### betaBucket: market-beta

Rows: 7. Labels: fade 4, follow 2, noisy 1.

| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| wick_exhaustion_scout | trigger-specialist | 42.9% | 100.0% | 3 | 0 | 4 | learning |
| trigger_fade_scout | strategy-agent | 100.0% | 57.1% | 4 | 3 | 0 | learning |
| velocity_continuation_scout | trigger-specialist | 57.1% | 50.0% | 2 | 2 | 3 | learning |
| book_pressure_scout | liquidity-scout | 28.6% | 50.0% | 1 | 1 | 5 | learning |
| relative_strength_scout | relative-matrix-scout | 100.0% | 42.9% | 3 | 4 | 0 | learning |
