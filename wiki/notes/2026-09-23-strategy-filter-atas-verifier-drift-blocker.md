---
type: note
created: 2026-09-23T07:30:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-atas-verifier-status-reconciliation
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - orderflow
  - ta
  - strategy-family
  - audit
related:
  - ./2026-09-22-strategy-filter-purged-embargo-implementation-preflight.md
  - ./2026-09-21-strategy-filter-purged-embargo-verifier-assertion-map.md
sources:
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../experiments/strategy-destruction-filter/test/engine.test.mjs
  - ../../outputs/atas-access-audit.json
  - ../../outputs/atas-access-audit.md
---
# Strategy Filter ATAS Verifier Drift Blocker

Bounded work item: `validation.strategy-filter-atas-verifier-status-reconciliation`.

## Question

Is the strategy-filter verifier baseline clean enough for the next purged/embargo implementation pass?

## Result

No. The focused engine test suite is clean, but the full verifier currently fails before the purged/embargo assertions can be expanded.

Local verification:

- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`: pass, `29 / 29` tests.
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`: fail.
- Failing assertion: `ATAS access audit verdict invalid`.
- Current ATAS audit verdict: `manual_csv_active__automatic_access_unproven`.
- Current verifier allow-list: `no_local_atas_access_detected`, `dev_runtime_partial_no_atas_install`, `local_install_detected`.

This is verifier/status drift, not a strategy promotion issue. The ATAS audit still says research-only, no local ATAS install detected from this workspace, no direct automatic pull, no credentials, no account setup, no paid feed, no live trading, no order placement, and no strategy promotion. It also records a manual CSV route as active through Tomas-provided Bid/Ask Tape and Smart Tape exports.

## Impact

The purged/embargo implementation should not be started from a failing verifier baseline. Otherwise the next run could conflate the boundary-split contract with an unrelated ATAS access status mismatch.

Smallest next fix:

1. Reconcile `verify-filter.mjs` with the newer ATAS access verdict taxonomy.
2. Keep the assertion strict: allow `manual_csv_active__automatic_access_unproven` only as research/manual-export access, not as automatic ATAS access.
3. Keep `canPullDirectlyNow === false` and the no-live/no-install boundary explicit for that verdict.
4. Re-run `npm run verify`.
5. Only after the verifier is clean, continue the purged/embargo split implementation.

## Reassessment

The current strategy-filter code path still has a clear next implementation map, but verifier hygiene has higher immediate value than adding new split metadata today. Confidence is high that this is a small reconciliation task because the ATAS audit JSON and Markdown agree on the manual CSV status and the engine tests still pass.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no web/source checks.
- Ran local verification before interpreting the state.
- Produced one durable note plus minimal queue/router/state/log breadcrumbs.
- Did not change strategy code, verifier code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid services, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
