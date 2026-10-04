# RALPH Local Swarm Run

Run: 2026-08-21T203317Z

Status: research-only, no live execution. This run did not touch watcher services, alert wording, thresholds, risk, sizing, accounts, wallets, keys, paid APIs, or execution.

## Dataset

- Finalized rows: 64
- Clean rows: 6
- Tainted rows: 58
- Labels: noisy 11, fade 26, follow 27
- Quality flags: book_not_fresh 52, negative_book_age 6, score_above_max 1
- Grouped slices: 20

## Jobs

- post_alert_dataset_audit: blocked/research-only
- relative_context_review: blocked/research-only
- orderflow_book_quality_audit: blocked/research-only
- slice_watchlist_review: blocked/research-only
- risk_governor_review: blocked/research-only
- synthesis_report: blocked/research-only

## Strongest Findings

- Best current scout: book_pressure_scout at 50.0% on 12 evaluated rows.
- Only 6 clean rows are available, so the risk governor blocks promotion.
- Slice watchlist leads are useful for targeted research, not live gates.

## Blockers

- Clean sample is far below a promotion threshold.
- Book-quality flags dominate the current dataset.
- No out-of-sample live-gate validation exists in this launcher.
- No relative-context slice has enough clean, forward-confirmed evidence.
- Relative matrix is scored against the same small finalized alert set.
- Book freshness is too sparse.
- Known negative-age and score-above-max quality flags remain in the historical row set.
- Changing orderflow scoring would touch alert behavior and is outside this task.
- Slice evidence is same-dataset and low-sample.
- No slice has passed risk-governor promotion conditions.
- clean_rows 6 < 30 minimum
- top agent has fewer than 20 evaluated rows
- top agent accuracy 50.0% < 58.0% watch threshold
- quality flags remain present in the research dataset
- no out-of-sample promotion test has been run
- executor remains explicitly closed

## Outputs

- `results/swarm-runs/2026-08-21T203317Z/run-summary.json`
- `results/swarm-runs/2026-08-21T203317Z/run-summary.md`
- `results/swarm-runs/2026-08-21T203317Z/artifacts/*.json`
