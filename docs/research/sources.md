# RALPH sources list (draft 2026-10-22, updated 2026-10-28: F1a prior art)

Purpose: every outside source behind RALPH's factory design, with an honest status. Extend it as sources are read; when a source is actually read and checked, give it its own page (wiki/sources convention) and change its status here.

Status legend:
- **N** = named by Claude (chat) from training; citation details and content NOT verified against the original.
- **R** = the source or its concept appears in the repo (where, from a grep at main e2b9c92 on 2026-10-22).
- **F** = an agent recorded fetching or reading it (taken over from that note; Claude has not read the source).
- No entry is verified by Claude yet. Verification happens in the prior-art step of decision (37): fetch the original, cite it in the spec, check formulas against Python reference fixtures (decision 17).

## Backtest statistics and overfitting

| Source | Topic | RALPH use | Status | Verify |
| --- | --- | --- | --- | --- |
| Marcos López de Prado, *Advances in Financial Machine Learning* (Wiley, 2018) | purged validation, embargo, effective number of trials by clustering | effective N (docs/factory-spec-f1.md:99, docs/ubiquitous-language.md:105); purged split in engine (`purged_boundary`, engine.mjs:263, :414); purging in 6, embargo in 4 files | N, R | F1b |
| David H. Bailey, Marcos López de Prado, "The Deflated Sharpe Ratio" (2014) | DSR: selection bias, multiple testing, non-normal returns | DSR gate (spec:39 and D4 spec:206: DSR >= 0.95 on effective N; config minDeflatedSharpe 0.35 as a proxy); DSR in 16 files | N, R, F (wiki/notes/2026-09-14-strategy-filter-deflated-sharpe-source-calibration.md records the PDF at davidhbailey.com) | F1b: formula vs fixtures |
| Bailey, Borwein, López de Prado, Zhu, "The Probability of Backtest Overfitting" | PBO, combinatorially symmetric cross-validation | not used | N | F1b candidate |
| Campbell R. Harvey, Yan Liu, "Backtesting" and multiple-testing papers | higher significance hurdles under many trials | not used | N | F1b candidate |
| Halbert White, "A Reality Check for Data Snooping" (Econometrica, 2000) | data-snooping test over many strategies | not used (the phrase appears in 1 wiki file, not checked) | N | F1b candidate |
| Peter R. Hansen, "A Test for Superior Predictive Ability" | SPA test, refinement of White | not used | N | F1b candidate |
| Robert Pardo, *The Evaluation and Optimization of Trading Strategies* | walk-forward analysis | walk-forward concept in 10 files; Pardo not named | N | F1b |

## Research method

| Source | Topic | RALPH use | Status | Verify |
| --- | --- | --- | --- | --- |
| Pre-registration practice (clinical trials, open science); no single source chosen | fix hypothesis, metric and test before looking | holdout single look, pre-registration hash, trial counting (pre-registration in 8 files) | N, R | pick a citable source in F1c |

## Execution, architecture, data

| Source | Topic | RALPH use | Status | Verify |
| --- | --- | --- | --- | --- |
| NautilusTrader (nautilustrader.io, github nautechsystems/nautilus_trader) | event-driven engine, backtest/live parity | funnel stage 4, D6 (decisions:32), ledger I06/I27, wiki notes 2026-08 | R | parity test before F1d |
| hftbacktest | queue position, latency, order-book replay | named in 2 files (spec HFT row) | R | when orderflow history exists |
| Freqtrade | lookahead analysis, dry-run, validation hygiene | wiki build-vs-buy memo 2026-08-30 | R (wiki), N for lookahead analysis | F1d prior art |
| binance/binance-public-data | Vision file layout, intervals, checksums | spec references list (docs/factory-spec-f1.md:217) | R | done in F1a-2 practice |

## Software engineering (data layer)

| Source | Topic | RALPH use | Status | Verify |
| --- | --- | --- | --- | --- |
| Kent Beck, *Test-Driven Development: By Example* | red/green TDD | "TDD evidence:" in every code commit body | N | not needed |
| Eric Evans, *Domain-Driven Design* | ubiquitous language | docs/ubiquitous-language.md (5 files mention it) | N, R | not needed |
| Content-addressed storage (as in git) | identity = hash of bytes | snapshots named by sha256, manifest | N, R | not needed |

## F1a prior art (decision 37)

Rows from docs/f1/f1a-3-plan.md section g (Claude Code, 2026-10-27) and docs/f1/f1a-4-prior-art.md (VPS agent, 2026-10-28).

| Source | Topic | RALPH use | Status | Verify |
| --- | --- | --- | --- | --- |
| binance/binance-public-data README | Vision layout, CHECKSUM per zip, publication cadence, archives may be updated | F1a-2 transport; F1a-3 and F1a-4 reference | R, F (Claude Code 2026-10-27, F1a-3 plan g; VPS agent 2026-10-28, F1a-4 report) | done |
| pandas `DataFrame.resample` docs | resampling defaults (origin, weekly bins closed and labelled right) | F1a-3 reference only: traps for the aggregation | F (F1a-3 plan g) | not needed |
| NautilusTrader docs: bar aggregation, FundingRateUpdate | composite bars; funding updates with optional interval (minutes) and next funding time, not a payment | F1a-3 and F1a-4 reference only; D6 parity test | R, F (F1a-3 plan g; F1a-4 report) | parity test before F1d |
| Freqtrade docs: `merge_informative_pair`, leverage (unavailable funding rates) | informative merge shift; a fallback for missing funding rates makes backtests inaccurate | reference only (F1d; F1a-4 missing-data rule) | R (wiki), F (F1a-3 plan g; F1a-4 report) | F1d prior art |
| npm `ohlc-resample` 2.2.0 README | OHLCV resampling library | rejected in F1a-3 (columns, float only, Node 26, LGPL-3.0) | F (F1a-3 plan g) | not needed |
| Binance Vision fundingRate archives | monthly settled funding, `funding_interval_hours` per row, CHECKSUM per zip | F1a-4 proposed source (decided in the F1a-4 plan) | F (VPS agent: S3 listings, six 2025-09 samples) | F1a-4 plan |
| Binance REST `/fapi/v1/fundingRate` and `/fapi/v1/fundingInfo` (legacy docs) | settled funding with markPrice and rateType; current adjusted intervals and caps | F1a-4: fundingRate proposed for markPrice, fundingInfo reference only | F (VPS agent: docs and one public GET each) | F1a-4 plan |
| Binance Vision dataset terms (TERMS_AND_CONDITIONS.md) | data license | ledger I93 | F (VPS agent) | data-catalog note (I93) |
| ccxt Manual, funding sections | unified funding-history interface | reference only | F (VPS agent) | not needed |
| Tardis docs: Binance futures coverage, derivative_ticker, billing | vendor funding channels; fundingRate channel only since 2026-10-16 | reference only, not a historical source | F (VPS agent, docs only) | not needed |
| Binance funding FAQ, fee FAQ, settlement-frequency announcements (2025-05-02, 2026-01-02), Academy article | settlement times, payment formula, interval changes | open questions of the F1a-4 report | N (the VPS agent's fetches returned empty bodies) | F1a-4 plan |
| QuantConnect LEAN BinanceFutureMarginInterestRateModel docs; bybt.com funding-rate explainer | secondary: funding = nominal position value x rate, nominal value = mark price x quantity | F1a-4 payment-price question | N (Claude saw search excerpts in chat 2026-10-28; pages not fetched) | F1a-4 plan |

## Planned inputs, not read

| Source | Topic | Status |
| --- | --- | --- |
| Kryhr/26-quant-trading-skills; quantskills backtesting-bias-avoidance; shakeebshaan strategy-critique | external skills for the pre-F1b gap check (read fully, no scripts, unvetted) | named in the continuation prompt only; not in the repo |
