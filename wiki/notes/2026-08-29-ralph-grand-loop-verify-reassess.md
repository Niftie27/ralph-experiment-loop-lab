---
type: note
created: 2026-08-29T19:20:00Z
topic: ralph-grand-loop
status: approved-active-contract
sources:
  - ../../rules.md
  - ../../core/autonomous-layer-goals.md
  - ../../core/automation-policy.md
  - ../../core/testing-protocol.md
  - ../../automation/current-operating-map.md
  - ../../automation/ralph-autoresearch-loop.md
  - ./2026-08-25-profitability-loop-integration-map.md
  - ./2026-08-29-shared-language-maintenance-and-grill-me.md
external_sources:
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/recursive-analysis/
  - https://nautilustrader.io/docs/latest/concepts/backtesting/
  - https://vectorbt.dev/
  - https://docs.jesse.trade/
  - https://github.com/tauricresearch/tradingagents
  - https://github.com/Open-Finance-Lab/AgenticTrading
  - https://github.com/ulab-uiuc/live-trade-bench
  - https://github.com/Open-Agent-Tools/open-paper-trading-mcp
  - https://arxiv.org/abs/2512.02261
tags:
  - ralph
  - research-note
  - audit
  - misc-research
---

# RALPH Grand Loop Verify/Reassess

Status: approved as the research/paper operating contract on 2026-08-29. The active compact contract lives at `../../core/profitability-flywheel.md`. This approval does not create cron, change live alerts, change execution, add paid/keyed access, authorize live trading, or approve scheduler, live alert wording, risk/sizing/TP/SL, public posting, paid services, or key handling changes.

## Restated Goals

RALPH's current goal is not to become a live trading bot. The goal is to become a trustworthy evidence machine that can discover, test, falsify, paper-track, and explain crypto trading ideas until a strategy is profitable in paper/demo conditions first. Only after that should live-money implications be discussed with explicit Tomas approval.

The practical goal is a self-improving automated research system that loops for long periods, verifies its work, records durable memory, and gradually needs less HITL while still requiring HITL for irreversible, costly, public, live-alert, or real-money decisions.

## Restated Rules And Principles

- No live trading, autonomous orders, wallet keys, exchange keys, paid APIs, paid infra, public publishing, account setup, or live copytrading without explicit approval.
- Prior-art before custom build: search web, GitHub, X/Twitter, docs, repos, papers, dashboards, APIs, and local tools before expanding collection, backtests, prototypes, or strategy code.
- Verify access, not just existence: local binary/package/MCP, auth, cost, license, data coverage, freshness, granularity, and export path.
- Run local statistics, then Verify/Reassess. Do not trust vibes, social claims, or successful command exit alone.
- If a direct route fails, retest differently, branch laterally, use existing frameworks/data/tools, or write a blocked note.
- Obsidian/RALPH is durable memory: important outputs get short notes, source links, queue/state updates when approved, and OpenClaw bridge ingestion/search verification.
- At large context size, create a continuation handoff before more substantial work.

## Prior-Art Scan

External evidence supports RALPH's current direction rather than replacing it with a black-box autonomous trader.

- Freqtrade validates lookahead and recursive indicator failure modes. Its docs explicitly warn that full-data backtests can cheat if strategy logic sees future candles, and recursive analysis checks differences between backtest and dry/live data availability.
- NautilusTrader is useful as an execution-realism reference because its backtests use the same core system components as live trading and expose matching/fill-model concepts.
- VectorBT is useful as a future parameter-sweep and feature exploration benchmark, but not installed locally.
- Jesse is useful as a crypto research reference because it combines backtesting, paper/live sessions, rule significance testing, Monte Carlo, multiple timeframes, and explicit overfitting warnings.
- TradingAgents, AgenticTrading, LiveTradeBench, and Open Paper Trading MCP show the broader AI-trading-agent shape: traceable decisions, benchmark baselines, paper/simulation before live, logs, risk checks, and evaluation environments. They are not drop-in replacements for RALPH's crypto alert/orderflow memory loop.
- X/Twitter search mostly surfaced repeated Freqtrade/Jesse/vectorbt/backtest/paper-trading recommendations and overfitting warnings. Treat X as inspiration/routing only, not evidence unless backed by code, data, docs, or reproducible results.
- TradeTrap is a warning: LLM trading agents can be misled by perturbations in market intelligence, strategy formulation, portfolio/ledger handling, and execution, producing concentration and drawdown failures. RALPH needs closed-loop stress tests and HITL gates before any execution-adjacent promotion.

## Access Classification

Active/local available:

- RALPH Research OS, OpenClaw wiki bridge, official Obsidian CLI, Node/npm, git, current alert-edge/filter artifacts, crypto-updates local indexes, Binance/Hyperliquid/Bybit public/no-key rails already documented.

Public/no-key usable:

- Freqtrade docs, vectorbt docs/repo, NautilusTrader docs/repo, Jesse docs/repo/site, GitHub public repo search, arXiv papers, public X/Twitter pages visible through web search, Hyperliquid no-key info endpoint, public exchange REST/WebSocket endpoints where rate limits allow.

Proposed/watch:

- Freqtrade as validation-hygiene reference or later sandbox; vectorbt for parameter sweeps; NautilusTrader/hftbacktest-style replay for fill realism; Jesse for crypto research workflow reference; TradingAgents/AgenticTrading/LiveTradeBench/Open Paper Trading MCP as architecture/evaluation references; community/operator profile scanning as idea-source lane.

Needs approval/account/key/payment:

- Installing frameworks as project dependencies, Docker-based services, Dune API, Arkham API, Nansen API, NewsAPI/Finnhub-style feeds, broker/exchange/testnet accounts, live or demo exchange API keys, paid dashboards/exports, Twitter/X API.

Inaccessible now:

- `session_status` command in this subagent shell; local Freqtrade/vectorbt/NautilusTrader/Jesse/ccxt/pandas/numpy packages; Docker; pipx/pip3; GitHub CLI auth/availability was not present as an active tool.

## Side-Quest Reassessment

The current side quests mostly serve the goal if they are routed through the profitability loop:

- Strategy-destruction-filter hardening is central, not a side quest. It prevents RALPH from fooling itself.
- DOGE/XRP candidate destruction is useful because it converts paper buckets into explicit specs and rejects weak ideas with evidence.
- TA learning/call-candidate work is useful only if it remains paper/watch until sample and execution evidence improve.
- Orderflow/hftbacktest work is useful when it tests execution realism and price-only versus orderflow lift; it becomes a distraction if it turns into custom infrastructure without a concrete candidate.
- Copytrading/wallet research is useful as a source lane for slow/cohort hypotheses; fast blind copytrading should stay radar/watch by default.
- Framework scanning is useful as a wheel gate; installing or migrating frameworks now would be premature unless a bounded spike proves a local gap.

## Proposed Grand Loop

Name: RALPH Profitability Flywheel.

Loop phases:

1. Intake: local alerts, finalized reviews, public/no-key data, prior art, GitHub/X/community ideas, existing notes.
2. Wheel gate: check existing frameworks, data, dashboards, repos, papers, and local tools; classify access.
3. Hypothesis: write a plain-English candidate with mechanism, market, timeframe, data requirements, assumptions, failure modes, and falsification threshold.
4. Kill test: run cheapest test first: source falsification, local stats, baseline comparison, bias check, OOS/walk-forward, deflated-Sharpe/proxy, replay/fill realism where needed.
5. Forward paper: only candidates that survive historical/basic gates get real-time paper/shadow tracking with R-denominated outcomes.
6. Postmortem: compare expected mechanism versus actual follow/fade/noisy/outcome, data freshness, missing fills, slippage assumptions, and execution classification.
7. Decision: move to Watch, Candidate, Paper-Qualified, Alert-Qualified, Rejected, or Blocked.
8. Memory: write or update Obsidian/RALPH note, source/candidate/ledger/queue/state/log as appropriate, ingest important notes into OpenClaw wiki, search-verify.
9. Reassess: decide continue, retest differently, branch laterally, return to queue, ask Tomas, or stop.

## State Machine

`Raw input -> Source-backed lead -> Watch -> Candidate -> Kill-tested candidate -> Forward-paper candidate -> Paper-qualified -> HITL review -> Alert-qualified proposal -> HITL approval required for alert surface -> Rejected/Blocked/Reassess`.

Live trading stays outside the state machine: `Execution discussion` is a separate future state requiring Tomas approval and new rules.

## Evidence Gates

- T0 hypothesis: explicit mechanism and falsifier.
- T1 evidence: at least three independent sources/repos when available; wheel-gate result; access classification; failure modes.
- T2 backtest/replay: sample count, winrate, expectancy in R, profit factor, max drawdown, baseline lift, OOS/walk-forward, fee/slippage assumptions, lookahead/recursive/bias check, source coverage.
- T3 forward paper: enough forward-only samples, open/closed/timeout/collision outcomes, split by asset/timeframe/regime/setup, paper PnL in R, exact-follow execution evidence separated when available.
- T4 prototype design: only after T2/T3 support, with cost, failure modes, and Tomas approval.
- T5 live/execution: out of current scope.

## HITL Gates

Tomas approval is always required for paid/keyed/account access, recurring job changes, live alert wording/delivery/threshold changes, package installs that become dependencies, large repo changes, risk/sizing/TP/SL/execution changes, public posting, demo/testnet account setup, and anything touching real money.

RALPH can act alone on local read-only stats, public/no-key searches, paper/shadow analysis, notes, source-backed proposals, queue hygiene, and strict rejection of weak candidates.

## Verification Steps Per Run

- Confirm scope and current autonomy level.
- Read router/index/queue/state and only relevant notes.
- Search web/GitHub/X before custom build or strategy expansion.
- Verify access classification for any proposed tool/source.
- Run local stats/tests/validators relevant to the claim.
- Check data quality: freshness, source match, timestamp alignment, label coverage, stale rows, missing rows, unrealistic fills.
- Verify Obsidian/OpenClaw output: ingest important note and `openclaw wiki search` it.
- End with Verify/Reassess: confidence up/down, next branch, stop trigger, and whether HITL is needed.

## Automation Cadence Proposal

Keep current schedules unchanged unless Tomas approves a new plan.

Recommended design, not activated:

- Every 4h: existing alert-edge paper/backtest refresh remains data production only.
- Twice weekly: current `ralph-autoresearch-loop` runs one bounded research item.
- Weekly: grand-loop reassessment run over queues, blockers, source access, and whether side quests still map to goals.
- Monthly or after major evidence change: framework/source access audit and autonomy boundary review.
- Event-triggered: if a strong market sample or candidate threshold appears, write note and ask Tomas only if it crosses notification gates.

## Failure, Stop, And Reassessment Triggers

- Stop candidate: insufficient sample, negative baseline lift, failed OOS/walk-forward, failed deflated-Sharpe/proxy, drawdown too high, stale/misaligned data, lookahead/recursive risk, unrealistic fills, no independent sources, or repeated mechanism failure.
- Stop loop run: context risk, source access blocked, tool missing, data freshness broken, scope drifting into paid/keyed/live behavior, or work item growing beyond bounded run.
- Reassess route: three consecutive blockers, surprising test result, repeated null result, noisy watcher period, Tomas pushback, new framework/source discovery, or candidate promotion threshold.

## Autonomy Levels

- A0: manual chat-run file/stat work. Safe and active.
- A1: Tomas asks RALPH to run a named loop once. Safe.
- A2: scheduled research/paper/source loops with no delivery except gates. Already approved for autoresearch and mostly achievable.
- A2.5: near-autonomous research operator: self-selects among approved queues, runs longer batches, writes notes, verifies wiki/search/tests, asks only at HITL gates. Achievable if Tomas approves clearer cadence and failure reporting rules.
- A3: paid/account/keyed/live-alert changes or demo/live execution. Not allowed now.
- A4: autonomous live trading. Not compatible with current boundaries and should remain forbidden.

## Verdict

Near-autonomous RALPH is achievable for research, paper/demo evidence, source discovery, candidate rejection, and Obsidian memory under current boundaries. Fully autonomous live trading is not achievable or appropriate under current rules. The right next move is not a new side quest; it is to formalize this grand loop as the routing contract, then let each future run pick the highest-value bounded queue item and prove its output through evidence gates.

## Self-Check

- `session_status` was attempted first but unavailable in the subagent shell.
- Local RALPH router, rules, automation policy, testing protocol, current operating map, work queues, loop state, autonomy goals, and recent notes were inspected.
- Web, GitHub, and X/Twitter searches were run before proposing.
- No cron, scheduler, alert behavior, paid/API/account setup, execution, or live trading behavior was changed.
- Durable note written under `wiki/notes/`; bridge ingest/search verification required after save.
