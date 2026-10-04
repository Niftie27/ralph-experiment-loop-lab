---
type: research-note
date: 2026-08-13
tags:
  - ralph
  - orderflow
  - alert-alignment
  - active-public-proxy
related:
  - 2026-08-11-orderflow-feature-taxonomy.md
  - 2026-08-10-public-orderflow-data-rail.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
sources:
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
  - ../../../crypto-updates/monitor-index.yaml
---

# Orderflow Alert Alignment Check

Status: local-statistics check for C-036 / U-038, refreshed 2026-08-28. This is research support only, not financial advice or a trading signal.

## Work Item

Selected queue item: `validation.orderflow-alert-alignment-backtest`.

Question: do the current Crypto Updates alert-review records contain enough public orderflow evidence to promote or reject the orderflow gate?

Method: joined local `alert_sent` records to `review_finalized` records in `crypto-updates/runtime/alert-feedback.jsonl`, then grouped review verdicts by available orderflow evidence fields already stored on alerts. No new web checks, credentials, exchange accounts, trading actions, threshold changes, or Telegram output were used.

## Sample

Joined sample: 9 finalized alert reviews with matching alert records.

Verdicts:

| Verdict | Count |
| --- | ---: |
| noisy | 5 |
| follow-useful | 3 |
| fade-useful | 2 |

Orderflow scoring coverage:

| Score bucket | Count | Verdict mix |
| --- | ---: | --- |
| no score | 4 | noisy 3, fade-useful 1 |
| score 0 | 1 | fade-useful 1 |
| score 2 | 3 | follow-useful 3 |
| score 4 | 1 | noisy 1 |

CVD alignment coverage:

| CVD bucket | Count | Verdict mix |
| --- | ---: | --- |
| no CVD | 4 | noisy 3, fade-useful 1 |
| CVD aligned with alert direction | 1 | noisy 1 |
| CVD against alert direction | 4 | follow-useful 3, fade-useful 1 |

Recent scored cases:

| Asset | Direction | Trigger | Evidence score | CVD alignment | Review verdict |
| --- | --- | --- | ---: | --- | --- |
| ETH | DOWN | VELOCITY 5m | 4/5 | aligned | noisy |
| HYPE | DOWN | WICK 5s | 0/5 | against / no flow | fade-useful |
| ETH | DOWN | WICK 5s | 2/5 | against | follow-useful |
| BTC | DOWN | WICK 5s | 2/5 | against | follow-useful |
| SOL | DOWN | WICK 5s | 2/5 | against | follow-useful |

## Interpretation

The current orderflow evidence is useful as a logging layer, but not enough for candidate promotion:

- The sample is tiny and mixed across BTC, ETH, SOL, and HYPE.
- Fresh public depth was unavailable on every scored alert, so the book-pressure half of the planned orderflow gate was not tested.
- `score 2/5` clustered with follow-through on the August 12 wick alerts, but that is only 3 cases and all from the same event window.
- One `score 4/5` ETH velocity alert ended noisy, so aggressive-volume plus CVD alignment alone is not sufficient.
- HYPE remains weaker because the current alert evidence often has no signed trade-flow sample.

## Verdict

C-036 stays `Candidate`; U-038 stays `Open`.

The public orderflow rail should not be promoted to a go/no-go setup gate yet. The next useful step is a bounded 2-4 hour public capture that keeps fresh depth available during monitor alerts, then reruns the same alignment check with book imbalance/spread fields populated and assets separated.

## 2026-08-17 Refresh

Selected queue item: `validation.ta-orderflow-alert-gate-backtest`, narrowed to a refresh of the same local alignment statistics after new finalized monitor reviews arrived on 2026-08-16.

Method: rejoined `alert_sent` and `review_finalized` rows in `crypto-updates/runtime/alert-feedback.jsonl`; grouped verdicts by stored orderflow evidence score and CVD direction. No new web checks, credentials, exchange accounts, live trading, alert wording, or alert threshold changes were used.

Joined sample: 13 finalized alert reviews with matching alert records, up from 9.

Updated verdicts:

| Verdict | Count |
| --- | ---: |
| noisy | 6 |
| follow-useful | 4 |
| fade-useful | 4 |

Updated orderflow scoring coverage:

| Score bucket | Count | Verdict mix |
| --- | ---: | --- |
| no score | 4 | noisy 3, fade-useful 1 |
| score 0 | 2 | noisy 1, fade-useful 1 |
| score 2 | 3 | follow-useful 3 |
| score 4 | 4 | noisy 1, follow-useful 1, fade-useful 2 |

Updated CVD alignment coverage:

| CVD bucket | Count | Verdict mix |
| --- | ---: | --- |
| no CVD | 4 | noisy 3, fade-useful 1 |
| zero / no flow | 2 | noisy 1, fade-useful 1 |
| CVD aligned with alert direction | 4 | noisy 1, follow-useful 1, fade-useful 2 |
| CVD against alert direction | 3 | follow-useful 3 |

New cases since the initial note:

| Asset | Direction | Trigger | Evidence score | CVD alignment | Review verdict |
| --- | --- | --- | ---: | --- | --- |
| HYPE | UP | VELOCITY 5m | 0/5 | zero / no flow | noisy |
| SOL | DOWN | WICK 5s | 4/5 | aligned | follow-useful |
| ETH | DOWN | WICK 5s | 4/5 | aligned | fade-useful |
| BTC | DOWN | WICK 5s | 4/5 | aligned | fade-useful |

Interpretation: the additional 2026-08-16 wick cluster weakens the earlier simple read that high score plus aligned CVD means follow-through. `score 4/5` now splits across follow, fade, and noisy outcomes, while the small `score 2/5` cluster still maps to follow-through but remains only 3 same-window cases. The strongest actionable unknown is still not directionality by CVD alone; it is whether fresh book state near the alert can separate exhaustion/fade from continuation.

Refreshed verdict: C-036 stays `Candidate`; U-038 stays `Open`. Do not promote the orderflow gate until fresh public depth is present on alert samples and price-plus-orderflow beats the price-only monitor baseline by asset/trigger family.

## 2026-08-20 Refresh

Selected queue item: `validation.ta-orderflow-alert-gate-backtest`, narrowed to a fresh local-statistics refresh after the Crypto Updates monitor added finalized reviews through `2026-08-20T04:11:35.975Z`.

Method: rejoined local `alert_sent` and `review_finalized` rows in `crypto-updates/runtime/alert-feedback.jsonl`; grouped verdicts by stored orderflow evidence score, CVD direction, book freshness, and asset/trigger family. No new web checks, credentials, exchange accounts, live trading, alert wording, or threshold changes were used.

Joined sample: 60 finalized alert reviews with matching alert records, up from 13.

Updated verdicts:

| Verdict | Count |
| --- | ---: |
| follow-useful | 29 |
| fade-useful | 24 |
| noisy | 7 |

Updated orderflow scoring coverage:

| Score bucket | Count | Verdict mix |
| --- | ---: | --- |
| no score | 4 | noisy 3, fade-useful 1 |
| score 0 | 33 | follow-useful 16, fade-useful 15, noisy 2 |
| score 1 | 3 | fade-useful 2, follow-useful 1 |
| score 2 | 9 | follow-useful 7, noisy 1, fade-useful 1 |
| score 3 | 2 | fade-useful 1, follow-useful 1 |
| score 4 | 9 | follow-useful 4, fade-useful 4, noisy 1 |

Updated CVD alignment coverage:

| CVD bucket | Count | Verdict mix |
| --- | ---: | --- |
| no CVD | 4 | noisy 3, fade-useful 1 |
| zero / no flow | 28 | follow-useful 14, fade-useful 13, noisy 1 |
| CVD aligned with alert direction | 23 | follow-useful 11, fade-useful 9, noisy 3 |
| CVD against alert direction | 5 | follow-useful 4, fade-useful 1 |

Book-state coverage:

| Book freshness bucket | Count | Verdict mix |
| --- | ---: | --- |
| fresh book unavailable | 60 | follow-useful 29, fade-useful 24, noisy 7 |

Asset/trigger check:

| Asset / trigger | Count | Verdict mix |
| --- | ---: | --- |
| HYPE VELOCITY 60s | 15 | fade-useful 9, follow-useful 5, noisy 1 |
| HYPE VELOCITY 5m | 13 | follow-useful 8, fade-useful 3, noisy 2 |
| SOL WICK 5s | 6 | follow-useful 3, fade-useful 3 |
| ETH WICK 5s | 5 | follow-useful 3, fade-useful 2 |
| ETH VELOCITY 5m | 5 | follow-useful 2, fade-useful 2, noisy 1 |

Interpretation: the larger sample makes the current score and CVD-only layer look less promotable, not more. `score 4/5` still splits evenly between follow and fade, and `score 0` is also balanced once HYPE event-only alerts dominate the sample. The only mildly directional bucket is `score 2/5`, but it has only 9 cases and still includes noisy/fade outcomes. Every joined alert still has `bookFresh=false`, so the actual public-depth gate remains untested.

Refreshed verdict: C-036 stays `Candidate`; U-038 stays `Open`. The next useful work item should not be another score-only refresh unless materially new book-state evidence appears. Prioritize fresh public depth capture or watcher-side book freshness repair before any candidate go/no-go.

## 2026-08-28 Refresh

Selected queue item: `validation.ta-orderflow-alert-gate-backtest`, narrowed to a current local-statistics refresh after the Crypto Updates monitor index reached `222` finalized reviews through `2026-08-28T12:03:28.505Z`.

Method: rejoined local `alert_sent` and `review_finalized` rows in `crypto-updates/runtime/alert-feedback.jsonl`; applied strict exclusions for negative `bookAgeMs`, delayed/untrusted delivery, and `score > maxScore`; grouped remaining rows by evidence score, CVD alignment, book freshness, and asset/trigger family. No new web checks, credentials, exchange accounts, live trading, alert wording, watcher behavior, risk/sizing, TP/SL, or threshold changes were used.

Joined sample after quality exclusions: `216` finalized reviews with matching alert records. Excluded rows: `6` legacy/parser-roll rows, all with negative `bookAgeMs`; one of those also had `score=6/5`.

Updated verdicts:

| Verdict | Count |
| --- | ---: |
| follow-useful | 100 |
| fade-useful | 97 |
| noisy | 17 |
| mixed | 2 |

Updated score coverage:

| Score bucket | Count | Verdict mix |
| --- | ---: | --- |
| score 0 | 109 | follow-useful 55, fade-useful 46, noisy 6, mixed 2 |
| score 5 | 41 | fade-useful 22, follow-useful 17, noisy 2 |
| score 4 | 28 | fade-useful 16, follow-useful 10, noisy 2 |
| score 2 | 17 | follow-useful 10, fade-useful 5, noisy 2 |
| score 3 | 11 | follow-useful 5, fade-useful 4, noisy 2 |
| score 1 | 6 | follow-useful 3, fade-useful 3 |
| no score | 4 | noisy 3, fade-useful 1 |

Book-state coverage:

| Book freshness bucket | Count | Verdict mix |
| --- | ---: | --- |
| fresh book unavailable | 141 | follow-useful 67, fade-useful 59, noisy 13, mixed 2 |
| clean fresh book | 63 | fade-useful 36, follow-useful 23, noisy 4 |
| stale book non-negative | 12 | follow-useful 10, fade-useful 2 |

Asset/trigger check:

| Asset / trigger | Count | Verdict mix |
| --- | ---: | --- |
| HYPE VELOCITY 5m | 48 | follow-useful 26, fade-useful 18, noisy 3, mixed 1 |
| HYPE VELOCITY 60s | 36 | fade-useful 18, follow-useful 14, noisy 3, mixed 1 |
| SOL WICK 5s | 33 | fade-useful 18, follow-useful 15 |
| ETH WICK 5s | 16 | follow-useful 9, fade-useful 7 |
| BTC WICK 5s | 14 | follow-useful 8, fade-useful 6 |
| ETH VELOCITY 5m | 12 | follow-useful 5, fade-useful 5, noisy 2 |
| ETH VELOCITY 15m | 10 | follow-useful 6, fade-useful 2, noisy 2 |
| ETH VELOCITY 60s | 10 | fade-useful 7, noisy 2, follow-useful 1 |
| SOL VELOCITY 5m | 10 | fade-useful 6, follow-useful 3, noisy 1 |

Clean-book probe: there are now `63` clean BTC/ETH/SOL rows with non-negative fresh book evidence. The largest narrow clean-book bucket is `SOL WICK 5s DOWN score 5/5, CVD aligned, book imbalance aligned negative, depth thinning`: `6` rows, `5` fade-useful and `1` follow-useful. That is useful enough to watch as a future kill-test seed, but it does not clear a promotion threshold by itself because the sample is still only six SOL rows and the broader clean-book population remains mixed.

Interpretation: the current price-plus-orderflow layer is better instrumented than on 2026-08-20, but still not a live gate. Score-only and CVD-only remain non-decisive, and clean fresh book evidence tilts fade overall without becoming robust across assets/triggers. C-036 stays `Candidate`; U-038 stays `Open`.

Verify/Reassess: this refresh completes the stale `validation.ta-orderflow-alert-gate-backtest` queue item for the current dataset. The next useful path is not another broad refresh; it is either a small strict-filter seed spec for the narrow SOL clean-book wick bucket, or continued book-quality/data-shape validation if fresh-book coverage regresses.

## Verify / Reassess

Access status: active local data only; public/no-key monitor artifacts; no credentials; no paid API; no account setup.

Prior-art / wheel gate: passed for this micro-run because it reused the existing Crypto Updates monitor and orderflow artifacts instead of adding a new collector or framework.

Self-check: safe action set only; public/free sources only; no live trading; no autonomous orders; no wallet or exchange keys; no financial advice; selective context; one durable note updated; no normal Telegram output because no notification gate was met. The 2026-08-20 refresh used local statistics only and found no candidate promotion, urgent setup alert, or high-value unknown requiring Tomas.
