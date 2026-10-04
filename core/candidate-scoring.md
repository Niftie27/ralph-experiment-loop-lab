# Candidate Scoring

RALPH should not promote candidates by excitement. Promotion needs a repeatable score and a named evidence threshold.

## Scores

Use 0-5 for each dimension.

| Dimension | Meaning |
| --- | --- |
| Portfolio fit | Builds Tomas's DeFi builder / research engineer credibility |
| Testability | Can be tested cheaply with public or local data |
| Evidence quality | Has concrete sources, datasets, repos, or historical events |
| Data rail fit | Can use existing or affordable rails |
| Time cost | Can be reduced to a small next experiment |
| Execution risk | Avoids keys, accounts, live trading, and paid infra |
| Differentiation | Not just another crowded bot path |

## Promotion Rules

- `investigate`: portfolio fit >= 3 and testability >= 3.
- `benchmark`: testability >= 4 and evidence threshold is measurable.
- `prototype`: benchmark result exists and execution risk stays bounded.
- `watch`: interesting but missing data, timing, or fit.
- `discard`: low fit, high cost, crowded execution edge, or no affordable data.

## Evidence Threshold Template

Every candidate should name:

- what would make it true
- what would falsify it
- minimum source count
- minimum dataset or sample size
- maximum acceptable cost
- next loop to run

