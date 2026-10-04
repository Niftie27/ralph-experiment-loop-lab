# Strategy Score Rubric Dry Run

Generated: 2026-08-22T06:23:36.884Z
Status: research-only-no-live-execution.

Second-stage rubric review over the candidate router. It audits route quality only; it does not mutate candidate states, alerts, thresholds, risk, sizing, execution, or strategy promotion.

## Verdict

The rubric loop is worthwhile because the first-stage router is useful for queue ordering but too permissive for `benchmark` labels. Keep the router, but add this review layer before changing candidate states.

## Totals

- Candidates reviewed: 37
- Accepted routes: 29
- Downgraded routes: 1
- Held routes: 3
- Discarded routes preserved: 4
- Rubric benchmark: 3
- Rubric investigate: 20
- Rubric watch: 10

## Accepted Top Routes

| ID | Candidate | Router | Rubric | Decision | Notes |
| --- | --- | --- | --- | --- | --- |
| C-015 | X/GitHub strategy knowledge loop | benchmark | benchmark | accept | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-036 | Public orderflow data rail | benchmark | benchmark | accept | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-009 | Trading bot framework/repo map | benchmark | benchmark | accept | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-003 | Zela benchmark discipline | investigate | investigate | accept | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-025 | Funding/basis structural baseline monitor | investigate | investigate | accept | cheap measurable next test; fits existing/local data rails |
| C-017 | Hyperliquid-first wallet-shadowing research | investigate | investigate | accept | cheap measurable next test; fits existing/local data rails |
| C-005 | Custom replay harness | investigate | investigate | accept | cheap measurable next test; low execution risk |
| C-006 | MEV bot failure-mode extraction | investigate | investigate | accept | cheap measurable next test |
| C-013 | REVM/Anvil simulation rail | investigate | investigate | accept | cheap measurable next test; low execution risk |
| C-026 | Tool-first existing stack | investigate | investigate | accept | cheap measurable next test; fits existing/local data rails; low execution risk |
| C-007 | AI Research OS contract alignment | investigate | investigate | accept | low execution risk |
| C-011 | Freqtrade/Jesse/vectorbt research rail comparison | investigate | investigate | accept | cheap measurable next test; fits existing/local data rails |

## Review Flags

| ID | Candidate | Router | Rubric | Decision | Flags |
| --- | --- | --- | --- | --- | --- |
| C-004 | DefiLlama battlefield context | benchmark | investigate | downgrade | broad context/data-source work needs a falsifiable benchmark before benchmark routing; benchmark route is too strong under rubric |
| C-027 | Freqtrade as strategy engine | investigate | watch | hold | execution-adjacent wording requires research-only containment |
| C-037 | Crypto Updates TA decision layer | investigate | watch | hold | execution-adjacent wording requires research-only containment |
| C-012 | NautilusTrader architecture study | investigate | watch | hold | execution-adjacent wording requires research-only containment |
| C-032 | Liquidation-map replay harness | discard | discard | discard | already discarded; execution-adjacent wording requires research-only containment |
| C-034 | Liquidation Q1 baseline kill switch | discard | discard | discard | already discarded |
| C-031 | Liquidation-map liquidity provision | discard | discard | discard | already discarded |
| C-033 | Liquidation-map prior-art gap map | discard | discard | discard | already discarded |

## Interpretation

- C-015, C-036, and C-009 remain good next research routes because they have specific no-key/read-only tests.
- C-004 should be downgraded from benchmark to investigate until the DefiLlama context rail has a falsifiable benchmark target.
- Paid/account-dependent rails such as Arkham/Nansen/Dune/Copin remain review-gated until workspace access and export paths are verified.
- This dry run changes routing confidence only. It does not promote strategies or alter live systems.
