# RALPH Swarm Research Job: slice_watchlist_review

Agent: slice_watchlist_reviewer
Status: research-only-no-live-execution

## Scope
Rank slices as research watchlist only; do not convert them to live gates.

## Inputs
- results/agent-scoreboard-slices.json

## Forbidden Actions
- place_live_orders
- modify_live_alert_runtime
- modify_alert_wording
- modify_alert_thresholds
- modify_risk_or_sizing
- read_exchange_account_or_wallet_credentials
- use_exchange_account_or_wallet_access
- use_paid_apis
- claim_live_promotion
- promote_slice_to_live_gate
- change_alert_thresholds

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "sample_counts": "object",
  "watchlist": "object[]",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/slice-watchlist-review.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
