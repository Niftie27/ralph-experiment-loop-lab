---
type: research-note
date: 2026-08-21
tags:
  - ralph
  - alert-feedback
  - data-analysis
  - orderflow
related:
  - 2026-08-20-book-freshness-repair.md
  - 2026-08-13-orderflow-alert-alignment-check.md
sources:
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
  - ../../../crypto-updates/runtime/setup-analysis.json
  - ../../../crypto-updates/realtime-market-watcher.mjs
---

# Alert Feedback Data Analysis

Status: research-only refresh over local Crypto Updates alert feedback through `2026-08-21T13:13Z`. This is not financial advice and made no live trading, alert wording, risk, sizing, threshold, account, key, or paid-API change.

## Verdict

The joined sample is now large enough to guide monitoring buckets, but not enough to promote a live gate. I joined `117` `alert_sent` rows to `110` finalized reviews. Verdicts are balanced enough that raw alert direction, score, and CVD-only evidence are still weak as standalone decision gates: `52` follow-useful, `47` fade-useful, `11` noisy.

The useful discovery is operational: the parser roll created real BTC/ETH/SOL book fields, but all six reviewed fresh-book rows before the timestamp fix have negative `bookAgeMs`, and one SOL row scored `6/5`. Those rows prove data can populate; they must not be used as clean edge evidence. After the `2026-08-21T12:20Z` timestamp fix there are two HYPE alerts and zero finalized post-fix BTC/ETH/SOL reviews, so the clean book-freshness validation set is still empty.

## Period Split

| Period | Alerts | Joined reviews | Verdict mix | Fresh book | Quality note |
| --- | ---: | ---: | --- | ---: | --- |
| pre `2026-08-21T08:25Z` | 98 | 96 | follow 45, fade 41, noisy 10 | 0 | score/CVD only; book gate untested |
| parser roll to `2026-08-21T12:20Z` | 17 | 14 | follow 7, fade 6, noisy 1 | 6 | book fields populate, but all fresh rows have negative `bookAgeMs`; one `score > maxScore` |
| after timestamp fix | 2 | 0 | none finalized | 0 | HYPE-only so far; no BTC/ETH/SOL clean proof |

## Buckets Worth Monitoring

Only buckets with real sample size should survive into the next analysis pass:

| Bucket | Sample | Verdict mix | 30m directional avg | 1h directional avg | Read |
| --- | ---: | --- | ---: | ---: | --- |
| HYPE `VELOCITY 5m DOWN score 0` | 12 | follow 9, fade 3 | +0.503% | +0.597% | watch as a possible continuation bucket, but HYPE lacks signed flow and book data |
| HYPE `VELOCITY 60s DOWN score 0` | 9 | fade 6, follow 3 | -0.808% | -0.841% | watch as a possible exhaustion/fade bucket, still event-only |
| ETH `WICK 5s` | 11 | fade 7, follow 4 | +0.595% | +0.510% | monitor with clean book fields; current fresh rows are timestamp-tainted |
| BTC `WICK 5s` | 9 | fade 5, follow 4 | +0.025% | +0.411% | too split for direction, but good for book-gate validation |
| SOL `WICK 5s` | 9 | fade 5, follow 4 | +0.489% | +0.324% | too split for direction, but good for book-gate validation |

`score 2/5` remains the only mildly directional score bucket (`13` samples: follow 8, fade 3, noisy 2), but it is not strong enough to promote because it mixes assets/triggers and includes stale or timestamp-tainted book state.

## Buckets To Suppress Or Ignore

- Treat `score 0/5` as non-decisive by itself: `61` joined samples split `30` fade, `28` follow, `3` noisy.
- Treat `score 4/5` as non-decisive by itself: `16` joined samples split `8` fade, `7` follow, `1` noisy.
- Ignore HYPE orderflow as an orderflow gate until Hyperliquid signed trades and/or `l2Book` are in the evidence path; current HYPE rows are mostly event-only allMids.
- Do not use pre-fix `bookFresh=true` rows for edge claims because `bookAgeMs` was negative in all six reviewed fresh-book rows.

## Entry Research Read

`39` joined reviews include entryResearch. The result is useful mainly as a fade caution:

- ETH `VELOCITY 5m UP` fade-short had `6` in-range samples but `5` follow-useful outcomes, so blind fade-short after that bucket was usually hurt.
- ETH `WICK 5s UP` fade-short had `5` in-range samples with `4` fade-useful outcomes, so it is a low-sample fade candidate to keep watching.
- BTC/ETH `WICK 5s DOWN` fade-long had `6` combined in-range samples split `4` fade-useful, `2` follow-useful; promising enough to monitor, not enough to call.
- `no_entry` did not reliably save bad ideas because it has only scattered single-case buckets.

## Data Quality Findings

- `bookFresh=false` or missing still covers most joined rows: `100` false, `4` missing, `6` true.
- Negative `bookAgeMs`: `6/6` reviewed fresh-book rows in the parser-roll period.
- `score > maxScore`: one SOL row, `SOL-DOWN-1787310760275-0fd565`, had `score=6` with `maxScore=5` in recorded feedback.
- Missing fresh-book fields: none among the six fresh rows; when book state exists, imbalance/spread/depth fields are present.
- Post timestamp-fix proof: no finalized BTC/ETH/SOL review yet. The next verifier must wait for post-`12:20Z` BTC/ETH/SOL reviews, not HYPE-only rows.

## Next Research Actions

1. Rerun this exact join after the delayed `14:30Z` verifier or after at least five finalized post-fix BTC/ETH/SOL reviews.
2. Add a research-only data-quality assertion in the analysis path: reject rows where `bookAgeMs < 0` or `score > maxScore` before edge grouping.
3. For BTC/ETH/SOL, compare wick buckets with clean `bookImbalance`, spread, and depth against the price-only baseline by asset and direction.
4. For HYPE, keep velocity buckets as movement taxonomy only until Hyperliquid signed flow/book evidence is accessible in the watcher path.
5. Do not promote any high-probability label from this sample; keep C-036 `Candidate` and U-038 `Open`.

## No Live Change

This pass only read local data and wrote research memory. It did not change live alert text, live thresholds, risk, sizing, trading behavior, exchange/account access, wallet access, keys, or paid data.
