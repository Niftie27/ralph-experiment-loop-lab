# RALPH Swarm Research Job: synthesis_report

Agent: synthesis_reporter
Status: research-only-no-live-execution

## Scope
Summarize what was learned, what is blocked, and next research-only steps.

## Inputs
- results/agent-swarm-feature-table.json
- results/agent-scoreboard.json
- results/agent-scoreboard-slices.json
- results/swarm-runs/2026-08-21T203357Z/artifacts/*.json

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
- claim_deployment
- modify_live_systems

## Required Output Schema
```json
{
  "job_id": "string",
  "source_files_used": "string[]",
  "run_summary": "object",
  "top_findings": "string[]",
  "blocked": "string[]",
  "promotable": "boolean"
}
```

Write the JSON artifact to: results/swarm-runs/2026-08-21T203357Z/artifacts/synthesis-report.json

Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.
