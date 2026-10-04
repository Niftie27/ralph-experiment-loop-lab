# RALPH Swarm Research Job: orderflow_book_quality_audit

Agent: orderflow_quality_auditor
Status: research-only-no-live-execution

## Scope
Measure freshness, missingness, negative ages, and score anomalies from existing artifacts.

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
- change_book_freshness_rules
- change_orderflow_scoring
- touch_live_connectors

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "sample_counts": "object",
  "orderflow_quality": "object",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/orderflow-book-quality-audit.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
