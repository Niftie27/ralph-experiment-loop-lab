# RALPH Swarm Research Job: risk_governor_review

Agent: risk_governor
Status: research-only-no-live-execution

## Scope
Block promotion unless clean sample, out-of-sample evidence, and risk conditions are satisfied.

## Inputs
- results/agent-scoreboard.json
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
- approve_live_execution
- set_trade_size
- open_executor

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "promotion_decision": "string",
  "risk_blockers": "string[]",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/risk-governor-review.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
