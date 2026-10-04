# Candidate Scoring Dry Run

Generated: 2026-08-22T06:23:36.994Z
Status: research-only-no-live-execution.

Dry-run heuristic over the candidate inventory. It routes work; it does not promote strategies, alter alerts, or authorize execution.

## Totals

- Candidates: 37
- Benchmark: 4
- Investigate: 22
- Watch: 7
- Discard: 4

## Top Routes

| ID | Candidate | Current | Recommended | Total | Next loop | Rationale |
| --- | --- | --- | --- | ---: | --- | --- |
| C-015 | X/GitHub strategy knowledge loop | Candidate | benchmark | 30 | framework-repo-discovery-loop | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-036 | Public orderflow data rail | Candidate | benchmark | 29 | validation-benchmark-loop | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-009 | Trading bot framework/repo map | Candidate | benchmark | 28 | framework-repo-discovery-loop | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-004 | DefiLlama battlefield context | Candidate | benchmark | 27 | investigation-loop | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-003 | Zela benchmark discipline | Candidate | investigate | 28 | investigation-loop | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-025 | Funding/basis structural baseline monitor | Candidate | investigate | 27 | strategy-research-loop | cheap measurable next test; fits existing/local data rails |
| C-017 | Hyperliquid-first wallet-shadowing research | Candidate | investigate | 26 | strategy-research-loop | cheap measurable next test; fits existing/local data rails |
| C-027 | Freqtrade as strategy engine | Candidate | investigate | 26 | framework-repo-discovery-loop | cheap measurable next test; fits existing/local data rails |
| C-005 | Custom replay harness | Watch | investigate | 25 | framework-repo-discovery-loop | cheap measurable next test; low execution risk |
| C-006 | MEV bot failure-mode extraction | Candidate | investigate | 25 | investigation-loop | cheap measurable next test |
| C-013 | REVM/Anvil simulation rail | Watch | investigate | 25 | investigation-loop | cheap measurable next test; low execution risk |
| C-026 | Tool-first existing stack | Candidate | investigate | 25 | validation-benchmark-loop | cheap measurable next test; fits existing/local data rails; low execution risk |

## Interpretation

This dry-run ranking is a router. It should be reviewed before mutating candidate states.
