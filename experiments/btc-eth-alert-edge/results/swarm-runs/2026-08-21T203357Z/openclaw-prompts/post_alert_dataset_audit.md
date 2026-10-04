# RALPH Swarm Research Job: post_alert_dataset_audit

Agent: dataset_auditor
Status: research-only-no-live-execution

## Scope
Read existing research-only feature and scoreboard files; summarize dataset fitness for future swarm research.

## Inputs
- results/agent-swarm-feature-table.json
- results/agent-scoreboard.json

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
- modify_source_data
- modify_live_watcher_or_alerts

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "sample_counts": "object",
  "quality_flags": "object",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/post-alert-dataset-audit.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
