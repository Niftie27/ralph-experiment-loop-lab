# RALPH Roadmap

Last updated: 2026-09-28T10:12:00Z

## Objective

Make RALPH behave like a research desk auditioning strategies for capital. The goal is not more alerts; the goal is a smaller set of strategies that survive fees, drawdown, baseline comparison, walk-forward checks, and paper/DEMO-SIM evidence.

## Current State

- Broad DEMO-SIM replay is not capital-ready: latest full ledger is `capital_impaired_review_required`.
- Short families are quarantined: latest short revalidation tested 20 short buckets and revalidated 0.
- The only useful current survivor is the 4h `range_breakout_long` under `BTC_RISK_ON`, especially `B|low-sample`; the latest stress pass keeps it only as a narrow paper-watch/research candidate with blockers.
- Current validation pending queue is empty; `strategy-filter-purged-embargo-split-classifier-implementation` is done and strict filtering left no current survivor promoted.
- Phase 2 discovery now has a completed source scan and four research-only seed specs: PDH/PDL BTC-gated sweep long, BTC-risk-on ORB continuation, funding-persistence context baseline, and range/grid offline falsifier.
- The first cheap PDH/PDL BTC-gated sweep/reclaim long kill test survived the September forward baseline check, but the harsher second gate rejected promotion: the best variant was mostly PDH reclaim, not true PDL sweep; it was positive in only 2/5 forward months, had excessive drawdown, and lost to touch-only baseline.
- The fixed BTC-risk-on ORB continuation kill test is rejected: 329 purged walk-forward trades, -3206.24 USDT per 10k, PF 0.8947, 1/5 positive forward months, and 99.47% max drawdown. It also remains much weaker than the existing `range_breakout_long + BTC_RISK_ON` replay pocket.
- The `range_breakout_long + BTC_RISK_ON` survivor stress pass did not fail remove-best symbol/month/week or fee stresses, but it remains blocked by top-pocket 28.0% max drawdown, 30.8% drawdown under extra 20 bps cost stress, negative ambiguous rows, a -5236.30 USDT loss cluster, and material best-week concentration.
- The research-only funding-persistence context baseline found a narrow positive context hint: `persistent_positive` Hyperliquid funding on selected `range_breakout_long + BTC_RISK_ON` rows had 55 trades, +6420.03 USDT per 10k, PF 1.8497, and 22.8% max drawdown, improving average PnL and PF versus BTC regime alone. This is context only, not carry/accounting/execution logic, and still inherits survivor-stress blockers.
- The funding-context survivor stress rejected promotion of that hint: `persistent_positive` stayed positive overall and after symbol/cost stresses, but failed remove-best month/week, with all 55 trades in August 2026 and 52/55 in week 2026-W34; top-pocket persistent-positive drawdown remained 26.7%.
- The survivor cluster postmortem shows the useful pocket is a short-lived broad alt risk-on expansion under BTC confirmation: 2026-W34 contributed +7827.87 USDT from 66 selected rows while BTC returned +19.8% over the focus window and 7/8 symbols were positive. The main failure mode is synchronized post-impulse loss, especially the 2026-08-22 cluster of 13 trades for -4752.49 USDT.
- The impulse-exhaustion cooldown postmortem found the first plausible defensive filter: skipping rows when the target symbol's prior 72h return is >25% kept 81 trades, improved net to +10471.10 USDT, PF to 2.3427, and max drawdown to 10.4%. The standalone purged-forward test did not confirm it: forward baseline was 41 trades / +1207.55 USDT / PF 1.1956 / 13.4% max DD, while the target skip was 36 trades / +398.96 USDT / PF 1.0770 / 16.8% max DD. Tag it `postmortem_viable_only`, not `viable_forward_validation_candidate`.
- The follow-up impulse-decay state-feature scan also rejected the richer standalone no-trade states. Target 72h overextension remains `postmortem_only`; breadth/participation decay, BTC-up-alt-cooldown, recent selected SL cluster, and composite decay states did not improve the purged-forward slice. Best forward state was unchanged versus baseline: 41 trades / +1207.55 USDT / PF 1.1956 / 13.4% max DD.
- Canonical pointer for that branch: `wiki/concepts/impulse-exhaustion-research-branch.md`. Use tags `impulse-exhaustion`, `postmortem-viable-only`, `not-forward-validated`, and `no-promotion` when routing future work.
- The fixed offline range-grid falsifier is rejected/watch-only: 292 BTC/ETH/SOL 4h grid trades, -140605.35 USDT per 10k accounting surface, PF 0.0576, 11.3% winrate, and trend-break losses dominating across all three symbols. Do not join it to DEMO-SIM or paper-fund surfaces.
- Scheduled 4h refresh exists and Tomas approved the repair on 2026-09-28; its cron payload now runs `demo-sim:all`, not just `demo-sim:replay`. The 2026-09-28 16:03 UTC scheduled run verified the repaired payload and refreshed the full DEMO-SIM bundle.
- Orderflow status: ATAS exports are parser/manual-review evidence, not a historical orderflow backtest rail. Binance historical spot/futures `aggTrades` archives are the best active public/no-key historical tape rail; Hyperliquid historical S3 is requester-pays/needs-tooling; Bybit recent public trades work but are not deep historical backtest data.

## Roadmap

### Phase 0 - Keep Automation Honest

Purpose: make scheduled refreshes, registry outputs, and verification match the actual DEMO-SIM chain.

Next actions:

- Keep watching normal recurrence after the verified 2026-09-28 16:03 UTC repaired run; the next task is not another scheduler repair unless error streaks return.
- Keep `research-validation-checklist.mjs` as the integrity gate.
- Repair stale maintenance outputs only when they affect routing or verification.
- Keep orderflow research manual/autoresearch-selected until a validated historical aggTrades archive fetcher and event queue exist; do not create a recurring orderflow job yet.

Done when:

- Scheduled refresh regenerates precision repair, replay, ledger, range gate, walk-forward grid, and short quarantine. Done for the first repaired run at 2026-09-28 16:03 UTC.
- Cron health has no repeated rate-limit/error streak after the next successful run.

### Phase 1 - Falsify The Current Survivor

Purpose: prove whether the `range_breakout_long + BTC_RISK_ON` pocket is real enough to keep studying.

Next actions:

- Keep the strict-filter and latest stress outcomes as blockers against promoting the old range-breakout survivor.
- Keep `range_breakout_long + BTC_RISK_ON` as paper-watch/research-only unless longer forward evidence removes the blockers.
- The standalone purged-forward test of the target-symbol prior-72h overextension no-trade rule is complete and downgraded to `postmortem_viable_only`; do not use this crude rule as a promotion path.
- Compare future candidates against no-trade, long-only, simple breakout, and current range-breakout baselines.

Done when:

- Done for now: the survivor is kept only as a precise paper-watch/research candidate with an explicit blocker list.

### Phase 2 - Expand Strategy Supply

Purpose: find new strategy families instead of overfitting one survivor.

Next actions:

- Downgrade `pdh-pdl-btc-gated-liquidity-sweep-long` to rejected/watch-only reference after second-gate failure; do not promote it.
- Downgrade `btc-risk-on-opening-range-breakout-continuation` to rejected/watch-only reference after the fixed UTC 4h ORB rule failed walk-forward, no-trade, and existing replay comparison gates; do not tune the ORB window from this failed branch.
- `funding-persistence-context-baseline` is complete as a first cheap context join. Keep it as a research-only context hint; any carry, account/margin, cost, sizing, alert, or execution design needs separate explicit approval.
- `funding-context-survivor-stress` is complete and rejects using funding as a promotion filter for now: the hint is concentrated in August 2026 / week 2026-W34 and top-pocket drawdown remains above readiness.
- Downgrade `range-grid-offline-falsifier` to rejected/watch-only reference after the fixed prior-range BTC-transition grid lost hard to no-trade and buy-and-hold.
- `impulse-cooldown-purged-forward-test` and `impulse-decay-state-feature-scan` are complete. Do not continue tuning this lane without new forward rows or richer breadth/flow/orderflow evidence.
- Keep funding/basis as context/baseline until separate cost/tail accounting exists.

Done when:

- At least 3 candidate specs exist with mechanism, data requirement, baseline, kill criteria, and DEMO-SIM route. Done on 2026-09-26 via `wiki/notes/2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md`.

### Phase 3 - Paper-Fund Capital Discipline

Purpose: treat DEMO-SIM like a bankroll, not just rows.

Next actions:

- Add allocation/risk surfaces only after strategy candidates survive Phase 1 or Phase 2.
- Keep shorts quarantined unless a new short thesis passes its own purged forward gate.
- Add postmortems for large drawdown clusters.

Done when:

- Paper fund reports strategy contribution, drawdown clusters, and promotion blockers without implying live readiness.

### Phase 4 - Execution Readiness, Later

Purpose: prepare for future demo/testnet/live-write only if the research earns it.

Next actions:

- Define execution mandate, max loss, symbols, kill switch, audit log, and credential path.
- Keep this inactive until Tomas explicitly approves access and boundaries.

Done when:

- There is a written mandate and a strategy with enough paper/DEMO-SIM evidence to justify testing execution infrastructure.

## Working Rule

Continue one bounded item at a time. Prefer falsification before expansion. Do not change live alerts, watcher behavior, thresholds, sizing, execution, keys, paid APIs, public posting, or scheduler payloads without explicit approval.
