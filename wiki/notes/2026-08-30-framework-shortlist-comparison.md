---
type: note
topic: framework-shortlist-comparison
created: 2026-08-30T09:10:00Z
last_updated: 2026-08-30T09:10:00Z
work_item: investigation.framework-shortlist-comparison
status: complete
scope: research-only
sources:
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/backtesting/
  - https://github.com/polakowo/vectorbt
  - https://nautilustrader.io/docs/latest/
  - https://jesse.trade/
tags:
  - ralph
  - research-note
  - source-scan
  - baseline-comparison
related:
  - 2026-08-28-framework-shortlist-wheel-gate.md
  - 2026-08-28-freqtrade-no-key-dry-run-spike.md
  - 2026-08-29-github-operator-source-map.md
  - 2026-08-30-btc-eth-row-level-parity.md
  - 2026-08-30-build-vs-buy-decision-memo.md
  - ../../experiments/btc-eth-alert-edge/results/framework-benchmark.md
---
# Framework Shortlist Comparison

## Purpose

This closes `investigation.framework-shortlist-comparison` as a bounded comparison over already verified RALPH framework notes and current local artifacts.

No new package install, clone, account setup, key, paid API, live connection, scheduler change, or execution path was added.

## Ranking

| Rank | Framework / rail | Current RALPH status | Best use now | Why not more |
| ---: | --- | --- | --- | --- |
| 1 | vectorbt | active ephemeral benchmark rail via `uv` with `plotly<6` | row-level and aggregate sanity checks for candle setups | portfolio mechanics differ from RALPH independent event-study rows |
| 2 | Freqtrade | candidate validation-hygiene reference, not locally runnable | lookahead, recursive/startup variance, dry-run discipline, trade export expectations | no verified local binary/import/Docker path; setup requires explicit approval |
| 3 | hftbacktest | reference / local replay spike lane | order-book replay, queue/latency/fill realism concepts | useful only for execution-realism questions tied to a concrete candidate |
| 4 | NautilusTrader | architecture reference | event-driven research/live parity concepts and data/fill boundaries | heavy for current small candidate sieve; live-capable path is approval-gated |
| 5 | Jesse | secondary crypto workflow reference | compare strategy research/backtest/paper/live workflow vocabulary | less directly useful than Freqtrade/vectorbt for current RALPH gates |
| 6 | OctoBot / grid-copy products | productized tool-fit references | remind RALPH not to build generic bot/grid/copy scaffolding | account/key/live-product paths are outside autonomous scope |

## Current Decision

RALPH should keep the current custom strategy-destruction and alert-edge harnesses, but only as Tomas-specific adapters and rejection discipline:

- vectorbt checks whether custom candle setup conclusions survive an external framework sanity test;
- Freqtrade contributes validation-hygiene requirements even before it is runnable;
- hftbacktest/Nautilus concepts gate replay and fill-realism work;
- Jesse/OctoBot/grid/copy products stay build-vs-buy references.

Do not adopt a full framework yet. The next framework action should be chosen by a concrete missing capability, not by curiosity.

## Framework Action Rules

- If the question is aggregate candle setup sanity: use vectorbt first.
- If the question is lookahead or recursive/startup bias: compare against Freqtrade docs first.
- If the question is order-book fill realism: use hftbacktest or Nautilus concepts first.
- If the question is bot UX/paper/live workflow: use Jesse/OctoBot as references only.
- If the action requires installation, Docker, exchange config, testnet/demo account, API key, wallet key, paid data, live execution, or persistent service changes: ask Tomas first.

## Falsifier

This comparison is falsified if a framework can produce the RALPH output contract directly:

- setup stats by symbol/timeframe/setup/direction/regime;
- baseline lift and fee/slippage assumptions;
- OOS or forward-only separation;
- row-level entry/exit parity report;
- paper/shadow ledger export;
- rejection reasons durable enough for RALPH memory.

Until then, frameworks benchmark or inform RALPH. They do not replace it.

## Reassess

Next useful framework-related branch should not be another broad shortlist. It should be one of:

- a specific vectorbt row-level parity extension for another candidate family;
- a Freqtrade install/setup proposal for Tomas review, if the benefit outweighs dependency risk;
- an hftbacktest/Nautilus replay-realism comparison tied to an actual orderflow candidate;
- no framework work, if the queue has a more evidence-ready strategy or source item.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
