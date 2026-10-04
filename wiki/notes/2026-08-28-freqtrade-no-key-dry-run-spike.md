---
type: note
name: Freqtrade No-Key Dry-Run Spike
created: 2026-08-28T10:11:00Z
last_updated: 2026-08-28T10:11:00Z
tags:
  - autoresearch
  - freqtrade
  - no-key
  - framework-discovery
  - strategy-destruction-filter
sources:
  - https://www.freqtrade.io/en/stable/configuration/
  - https://www.freqtrade.io/en/stable/data-download/
  - https://www.freqtrade.io/en/stable/backtesting/
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/recursive-analysis/
related:
  - ./2026-08-28-framework-shortlist-wheel-gate.md
  - ../concepts/strategy-destruction-filter.md
  - ../../decisions/unknowns.md
  - ../../automation/work-queues.yaml
---

# Freqtrade No-Key Dry-Run Spike

Status: access/viability spike complete; Freqtrade remains a candidate benchmark, not an active local dependency.

## Question

Can Freqtrade be used as a no-key validation-hygiene benchmark for one RALPH strategy candidate family without exchange credentials, live execution, dry-run account setup, or package installation in this recurring cron run?

## Local Access Check

Local checks on 2026-08-28:

- `freqtrade` binary: not found.
- Python import `freqtrade`: not installed under `python3`.
- `pipx` and `pip3`: not found.
- `docker`: not found.
- local Freqtrade repo/cache paths under `/home/coder/.openclaw/workspace` and `/home/coder`: not found by filename search.

Verdict: no runnable local Freqtrade path is currently verified. Do not mark Freqtrade active until Tomas separately approves a setup route or a local dependency path appears.

## Public No-Key Fit

Official docs still support the idea that Freqtrade is useful as a validation-hygiene benchmark:

- Dry-run mode is documented as simulation only: wallets and orders are simulated, and orders are not posted to the exchange. The docs also say API keys are not required for dry-run trade simulation and may be empty.
- Backtesting requires historic data, supports fees, timeranges, starting balances, trade export, and a custom data directory, so it can be compared against RALPH's current strict-filter artifacts if a local install is approved later.
- Data download can fetch candle data with explicit exchange, pair, timeframe, and timerange arguments, but this would use exchange public endpoints and a local Freqtrade install.
- `lookahead-analysis` chains backtests and compares baseline versus sliced signals to expose future-data leakage, which maps directly to RALPH's strategy-destruction goal.
- `recursive-analysis` checks whether indicator values vary across different startup candle lengths, which is a useful dry/live realism check for indicator-based candidates.

## Reuse Decision

Freqtrade should not replace the current RALPH filter. The current filter already has Tomas-specific candidate schema validation, OOS split, baseline comparison, deflated-Sharpe proxy, walk-forward invariant, and semantic rejection ledger.

The useful reuse path is narrower:

1. Treat Freqtrade as an external validation-hygiene benchmark for future candidate families.
2. Borrow the explicit bias classes now: lookahead leakage, recursive/startup-candle variance, non-reproducible dynamic pairlists, backtest-only fills, and missing dry-run parity.
3. Add custom RALPH tests only where the current harness lacks those guard concepts.
4. Require separate approval before any install, Docker setup, Freqtrade userdir creation, account setup, exchange integration, API key, or testnet/demo key.

## Proposed Next Small Work

Add a local strategy-filter bias-hygiene checklist that maps current RALPH gates against Freqtrade's two strongest guard concepts:

- lookahead leakage: no future candle access, no full-column aggregation without rolling windows, no shifted future labels in entry/exit rules;
- recursive/startup variance: indicators should be stable across truncated warmup windows or explicitly classified as unstable.

This can be done inside the existing RALPH harness without installing Freqtrade.

## Verify And Reassess

This run used official-doc checks plus local access checks; it exceeded the intended four-source cap by one because backtesting needed separate confirmation after the dry-run and bias-analysis pages. The direct no-key dry-run path failed because there is no runnable local Freqtrade, no Docker, and no package installer available in the checked environment. The alternate route is to extract validation-hygiene requirements from public docs and keep Freqtrade as a candidate benchmark/watch item until setup is explicitly approved.

Self-check: research-only; public/free docs only; no package install; no API keys; no accounts; no paid access; no execution, orders, wallet keys, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.
