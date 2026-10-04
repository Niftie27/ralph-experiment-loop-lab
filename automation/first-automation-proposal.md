# First Automation Proposal

Status: draft, not approved, not active.

## Proposal

Run a daily A2 Market/Battlefield research loop that collects only public/free source candidates and writes a draft note for review.

## Cadence

Daily, morning Europe/Prague.

## Inputs

- Local `crypto-updates/sources.md`
- Protocol blogs and status pages
- Security incident sources
- DefiLlama public endpoints, if used without paid infra
- Existing RALPH unknowns and candidates

## Outputs

- `wiki/notes/YYYY-MM-DD-battlefield-scan.md`
- updates to `decisions/unknowns.md`
- updates to `decisions/candidates.md`
- `log.md` entry

## Explicit Non-Goals

- No trading
- No execution
- No wallet or exchange access
- No paid API
- No public publishing

## Approval Needed

This needs Tomas approval before any cron or recurring worker is created.

