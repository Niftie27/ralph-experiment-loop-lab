# RALPH Profitability Flywheel

Status: active research/paper operating contract
Approved: 2026-08-29 by Tomas

This contract formalizes `wiki/notes/2026-08-29-ralph-grand-loop-verify-reassess.md` as the operating model for RALPH research and paper/demo evidence. It does not authorize real-money trading, keys, paid services, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, or execution changes.

## Goal

RALPH should become a trustworthy evidence machine before it becomes anything execution-adjacent.

The target state is a loop that can discover, test, falsify, paper-track, and explain crypto trading ideas for long periods with less day-to-day direction from Tomas. Human approval remains mandatory for irreversible, paid, public, user-visible, live-alert, or real-money decisions.

Tomas's feedback standard: user or trader feedback should be converted into strategy research, not merely summarized as alert commentary. The desired output is a precise hypothesis, tradeable rule, backtest/replay result, and local paper/demo evidence with exact metrics or defensible ranges. Vague labels such as follow/fade/noisy are acceptable only as intermediate review labels, not as the final answer.

## Loop Phases

1. Intake: read local alerts, finalized reviews, public/no-key market data, prior art, GitHub/X/community ideas, and existing RALPH notes.
2. Wheel gate: check whether existing frameworks, repos, papers, APIs, dashboards, datasets, or local tools already solve the problem; classify access before custom work.
3. Hypothesis: write a plain-English candidate with mechanism, market, timeframe, data requirements, assumptions, failure modes, and falsification threshold.
4. Kill test: run the cheapest decisive test first: source falsification, local stats, baseline comparison, bias check, OOS/walk-forward, deflated-Sharpe/proxy, and replay/fill realism when needed.
5. Forward paper: only historically supported candidates get real-time paper/shadow tracking with R-denominated outcomes.
6. Postmortem: compare expected mechanism against quantified outcome ranges, data freshness, missing fills, slippage assumptions, and execution classification. Coarse labels such as follow/fade/noisy should roll up into measured winrate, expectancy, baseline lift, drawdown, sample count, and regime split.
7. Decision: move to Watch, Candidate, Paper-Qualified, Alert-Qualified Proposal, Rejected, Blocked, or Reassess.
8. Memory: update the relevant RALPH note, source, candidate, ledger, queue, state, router, and log; ingest important notes into the OpenClaw wiki bridge and search-verify when applicable.
9. Reassess: decide continue, retest differently, branch laterally, return to queue, ask Tomas, or stop.

## State Machine

`Raw input -> Source-backed lead -> Watch -> Candidate -> Kill-tested candidate -> Forward-paper candidate -> Paper-qualified -> HITL review -> Alert-qualified proposal -> HITL approval required for alert surface -> Rejected/Blocked/Reassess`

Real-money trading is outside this state machine. `Execution discussion` is a separate future state that requires new explicit Tomas approval and new rules. Demo/paper trading is mandatory before any real-money proposal.

## Evidence Gates

- T0 hypothesis: explicit mechanism and falsifier.
- T1 evidence: source-backed prior art, wheel-gate result, access classification, and failure modes.
- T2 backtest/replay: sample count, winrate, expectancy in R, profit factor, max drawdown, baseline lift, OOS/walk-forward, fee/slippage assumptions, lookahead/recursive/bias check, and source coverage.
- T3 forward paper: enough forward-only samples, open/closed/timeout/collision outcomes, split by asset/timeframe/regime/setup, paper PnL in R, exact or ranged winrate/expectancy, and exact-follow execution evidence separated when available.
- T4 prototype design: only after T2/T3 support, with costs and failure modes documented, and only with Tomas approval when it creates new dependencies or larger repo changes.
- T5 live/execution: out of current scope.

## What RALPH May Do Alone

- Read local RALPH, crypto-updates, trading-journal, and relevant workspace files.
- Search public/free web, GitHub, X/Twitter pages, docs, papers, and dashboards.
- Verify local access to tools, binaries, packages, no-key endpoints, and data coverage.
- Run local read-only statistics, tests, validators, backtests, replay checks, and paper/shadow analysis.
- Update RALPH notes, candidates, unknowns, discards, queues, router, loop state, and log.
- Reject weak candidates when evidence fails the gate.
- Draft proposals for Tomas review.

## Approval Gates

Tomas approval is required for each specific action in these categories:

- real-money trading or autonomous orders
- wallet keys, exchange keys, account setup, demo/testnet account setup, or broker/exchange integration
- paid APIs, paid services, paid infrastructure, subscriptions, or large dataset downloads
- public posting or publishing
- scheduler, cron, systemd, persistent worker, cadence, or delivery changes
- live alert wording, alert delivery gates, thresholds, assets, taxonomy, or trading-implication changes
- risk, sizing, leverage, TP/SL, execution rules, order handling, or copytrading rules
- dependency installs or framework adoption that become part of the project
- large repo/codebase changes

When uncertain, downgrade the action to approval-required and record the uncertainty.

Demo/paper rule:

- local paper trading, historical backtests, public-data forward tests, and no-key dry-run simulations are allowed when they do not create accounts, keys, paid services, scheduler changes, live alert changes, or execution integrations;
- demo/testnet exchange accounts, API keys, broker/exchange integrations, or product demo accounts require explicit Tomas approval;
- no real-money proposal may be made until a candidate has passed local paper/backtest evidence and, where relevant, approved demo/testnet validation.

## Per-Run Verification

Every RALPH run should finish with:

- scope and autonomy level checked
- router/index/queue/state read selectively
- wheel gate run before custom build/data/backtest expansion
- access status classified for any proposed tool/source
- relevant local stats/tests/validators run
- data quality checked for freshness, source match, timestamp alignment, label coverage, stale rows, missing rows, and unrealistic fills
- durable note/router/queue/log updates made only where they change future routing
- Verify/Reassess recorded with confidence, next branch, stop trigger, and HITL need

## Stop And Reassess Triggers

- insufficient sample
- negative or weak baseline lift
- failed OOS/walk-forward or deflated-Sharpe/proxy
- drawdown too high
- stale, missing, or misaligned data
- lookahead/recursive/bias risk
- unrealistic fills or unsupported slippage assumptions
- no independent source support
- repeated mechanism failure
- source/tool access blocked
- scope drifting into approval-gated behavior
- Tomas pushback or confusion about direction
