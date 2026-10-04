# RALPH Swarm Research Job: relative_context_review

Agent: relative_matrix_reviewer
Status: research-only-no-live-execution

## Scope
Use only cached feature rows and grouped scoreboards to identify relative-context research hypotheses.

## Inputs
- results/agent-swarm-feature-table.json
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
- change_alert_filters
- promote_relative_matrix_to_live_gate

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "sample_counts": "object",
  "alignment_counts": "object",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/relative-context-review.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
