---
type: research-lane
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - orderflow
  - data-rails
  - no-live-trading
related:
  - ../../wiki/notes/2026-09-28-historical-orderflow-data-rails.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.md
  - ../../wiki/notes/2026-09-20-atas-manual-orderflow-rail.md
  - ../../wiki/notes/2026-10-03-full-path-mfe-mae-usdm-absorption-rescore.md
---

# Orderflow Research Lane

Purpose: make orderflow evidence reproducible enough to test, while keeping trader-grade tools like ATAS useful for interpretation.

## Current Rail Ranking

1. `active`: Binance USD-M public archives.
   - Best no-key starting rail for perp tape plus coarse historical liquidity surface.
   - Verified locally for `trades` and `bookDepth`.
   - Current proof: `../../experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.md`.

2. `active`: Binance spot public archives.
   - Good for spot trade tape.
   - Weak for book context because spot public archive does not expose the same `bookDepth` rail.

3. `benchmark`: Tardis.dev.
   - Proper historical replay rail for trades plus depth.
   - Use first-day-of-month no-key samples as schema/proof.
   - Paid coverage is a buy decision, not a default dependency.

4. `manual/HITL`: ATAS.
   - Best for visual decision review, footprint/cluster interpretation, replay review, and export examples.
   - Not the scalable historical backtest rail unless Tomas exports windows or an exporter path is explicitly approved.

5. `watch`: OKX historical downloads.
   - Next public candidate to verify for automatable trade plus order book access.

6. `needs-approval`: Hyperliquid historical S3.
   - Potentially useful for venue-specific L2/fill history.
   - Needs AWS requester-pays and LZ4 tooling approval.

## What ATAS + Tardis Together Could Mean

ATAS and Tardis solve different problems.

- Tardis is the machine replay/data source: historical trade/depth feed, normalized/raw files, deterministic reruns.
- ATAS is the human microscope: footprint, cluster search, replay visuals, Big Trades, CVD, profile/context, trader interpretation.

Useful combined workflow:

1. Use Tardis or Binance/OKX archives to generate frozen event windows.
2. Compute simple features: taker delta, CVD slope, price progress per aggressive volume, book-depth change, spread/void context.
3. Open the same windows in ATAS manually or via export to label what a trader would actually see: absorption, initiative, trapped flow, sweep/reclaim, no-trade.
4. Compare machine labels vs ATAS human labels vs candle-only outcomes.
5. Only if the richer label beats candle/proxy baselines on a broad frozen sample, propose a separate experiment. Do not wire it into alerts directly.

## Current Next Useful Batch

The 2026-09-29 broader run expanded `usdm-orderflow-demo-sim-batch` from 3 rows to 30 frozen DEMO-SIM windows across USD-M-supported symbols.

Current result:

- 30/30 windows joined to public/no-key USD-M futures trades plus bookDepth.
- Verdict: `usdm_archive_features_broader_sample_ready_no_promotion`.
- Descriptive split: absorption-proxy rows were positive in this clustered sample; liquidity-thinning rows were negative.
- No promotion: sample remains clustered and uses existing replay outcomes.

Next expansion should build a less clustered manifest across more dates/setup buckets before making any claim.

Balanced validation follow-up: `../../wiki/notes/2026-09-29-balanced-usdm-absorption-validation.md`
Targeted falsification follow-up: `../../wiki/notes/2026-09-29-targeted-usdm-absorption-falsification.md`
Full-path MFE/MAE follow-up: `../../wiki/notes/2026-10-03-full-path-mfe-mae-usdm-absorption-rescore.md`

- Built a 60-row frozen manifest diversified by date/week, symbol, setup, direction, timeframe, BTC gate, and outcome.
- All 60 rows joined to public/no-key Binance USD-M `trades` plus `bookDepth`.
- Verdict: `balanced_usdm_archive_absorption_watch_only_no_promotion`.
- Kill condition did not trigger because the only qualifying outside-cluster comparable bucket still showed positive absorption lift, but that evidence is tiny: 1 bucket / 5 rows.
- Absorption remains watch-only and is not a candidate; liquidity-thinning had no comparable flagged buckets; aligned CVD overlaps heavily with absorption in the qualifying bucket.
- Targeted comparable follow-up used 80 rows across 8 comparable buckets. Absorption survived as a research feature outside the original cluster, but remains no-promotion because the sample is targeted, reuses existing DEMO-SIM outcomes, and aligned CVD overlaps heavily with the absorption definition.
- Full-path MFE/MAE rescore joined 76/80 targeted rows to canonical DEMO-SIM candle paths. Outside the original cluster, absorption kept positive final-R lift (`+0.8651R`) and MFE lift (`+0.3469R`) with lower MAE (`-0.3164R`), while liquidity-thinning remained weak/mixed. Aligned CVD remains nearly identical, so overlap is still a caveat.
- Current decision: absorption remains research-feature watch-only, not a candidate or gate. Stop tuning absorption for now. Revisit only with fresh forward rows or a broader pre-registered sample that was not selected after seeing existing DEMO-SIM outcomes.

Former backlog items: `usdm-absorption-balanced-manifest-validation`, `usdm-absorption-targeted-comparable-falsification`, `usdm-absorption-full-path-mfe-mae-rescore`

- Balanced run completed once with 60 rows; targeted comparable run completed once with 80 rows; full-path MFE/MAE rescore completed once with 76 eligible candle paths.
- Any next run should compare `absorptionProxy`, `liquidityThinningProxy`, and aligned CVD against same setup/regime rows, keep the kill condition, and pre-register the manifest before looking at outcomes.
- Boundary: no scheduler, live/demo/paper alert logic, thresholds, sizing, TP/SL, execution, paid/API key/account access, or strategy promotion.

Required comparisons:

- no-trade baseline
- candle-only MFE/MAE baseline
- existing planned-level proxy baseline
- same setup/regime bucket without orderflow feature

## Boundary

No scheduler change, no live execution, no account/key/API credential, no paid service, no watcher/paper/demo alert logic, no thresholds, no sizing, no TP/SL, and no strategy promotion.
