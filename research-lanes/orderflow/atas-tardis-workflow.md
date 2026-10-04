---
type: workflow-note
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - orderflow
  - atas
  - tardis
  - workflow
related:
  - README.md
  - ../../wiki/notes/2026-09-28-historical-orderflow-data-rails.md
---

# ATAS + Tardis Workflow

## Short Answer

ATAS plus Tardis helps if we want both:

- deterministic historical data for code/backtests
- trader-grade visual labels for whether the orderflow pattern is real

It does not magically create an edge. It creates a better labeling and falsification loop.

## Roles

| Tool | Role | RALPH fit |
| --- | --- | --- |
| Tardis | Historical trades/depth replay and CSV/API source | Best paid benchmark for true replay if free/public rails are not enough |
| ATAS | Visual footprint/cluster/orderflow workstation | Best human-review layer for absorption/sweep/reclaim labels |
| Binance USD-M archive | Free/no-key tape plus coarse bookDepth surface | Best active first batch rail |
| OKX historical data | Public candidate for alternative venue replay | Verify next before treating as active |

## Practical Use

1. RALPH freezes event windows from DEMO-SIM/live-alert review rows.
2. Code fetches historical tape/depth from Binance USD-M, Tardis sample, or OKX if verified.
3. Code emits a compact review packet: symbol, UTC window, BTC gate, target PA, outcome, machine orderflow features.
4. ATAS is used to inspect or replay the same window and produce a human label.
5. RALPH compares labels and outcomes across enough rows.

## Buy Gate For Tardis

Do not buy Tardis only because it is "proper."

Buy only if:

- free USD-M/OKX rails show the orderflow feature family is promising but limited by missing true depth replay
- no-key Tardis samples prove schema and workflow fit
- the target test has a frozen manifest, expected number of rows, and kill criteria
- the spend cap is explicit

## ATAS Gate

Use ATAS now for manual review and export examples.

Do not treat ATAS as scalable backtest data until:

- export/replay windows are reproducible
- window naming matches RALPH event IDs
- CSV/export schema is stable
- Tomas explicitly approves any account, data feed, or automation path

## Boundary

This is a research workflow only. No orders, no account access, no scheduler, no paper/demo/live logic, no risk settings, and no strategy promotion.
