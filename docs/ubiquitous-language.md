# Ubiquitous language

Last updated: 2026-08-30

This is the shared RALPH vocabulary for Tomas, the agent, Obsidian notes, and code-facing specs.

## Core entities

| Term | Definition | Canonical spelling in code | Notes |
|------|------------|----------------------------|-------|
| RALPH | Crypto research-memory and decision system. | `ralph` | RALPH is not a live trading bot. |
| Alert | User-visible market message from the watcher. | `alert` | An alert can contain analysis, but it is not proof of a tradeable edge. |
| Watcher | Realtime market monitor that detects events and sends alerts. | `watcher` / `realtime-market-watcher` | Observation and alerting only. |
| Reactor | Read-only execution monitor that joins actual fills to alerts. | `bybit-execution-reactor` | Must not place, amend, or cancel orders. |
| Research loop | Bounded RALPH task that reads sources, runs statistics, updates notes, and reassesses. | `researchLoop` | Must use the wheel gate before custom build/data expansion. |
| RALPH Profitability Flywheel | Active research/paper operating contract for turning inputs into source-backed candidates, kill tests, forward paper evidence, decisions, memory updates, and reassessment. | `profitabilityFlywheel` | Does not authorize live trading, keys, paid services, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, or execution changes. |
| Research/validation engine | The whole RALPH operating system that runs loops, keeps memory, rejects weak ideas, and promotes only evidence-backed candidates. | `researchValidationEngine` | Not one loop; loops are components inside it. |
| Strategy candidate | Explicit edge hypothesis that can be tested and killed. | `candidate` | Needs source, mechanism, data, failure mode, and cheapest kill test. |
| Source | Durable evidence item: local transcript, docs, repo, paper, dashboard, data/API, or experiment output. | `source` | Sources must be routed through index/wiki conventions when durable. |
| Trading journal | Obsidian-facing join of alerts, paper/shadow outcomes, and captured executions. | `tradeResearchJournal` | Research evidence, not a profitability claim. |
| Evaluation bucket | Separate evidence lane for judging outcomes without mixing different behaviors. | `evaluationBucket` | Canonical buckets: paper/shadow alert, exact-follow execution, modified-alert execution, manual-independent execution. |

## Value objects

| Term | Definition | Canonical spelling in code | Notes |
|------|------------|----------------------------|-------|
| Full TA | Multi-timeframe scenario analysis covering HTF context, mid-TF setup, LTF trigger, invalidation, alternatives, and trade-class fit. | `fullTa` | Not just more text around a lower-timeframe trigger. |
| HTF context | Higher-timeframe structure: trend, major liquidity, regime, large levels, and thesis invalidation. | `htfContext` | Determines whether an alert is only a scalp trigger or part of a larger idea. |
| Mid-TF setup | Intraday/session structure: range, VWAP/value, acceptance/rejection, likely paths. | `midTfSetup` | Bridges strategic context and execution trigger. |
| LTF trigger | Low-timeframe entry evidence such as volume velocity, wick shock, sweep, orderflow, or breakout/retest. | `ltfTrigger` | Often suitable for fast trades; insufficient alone for medium/long trade thesis. |
| Trade class | Intended holding-period and management family. | `tradeClass` | Canonical values: `fast`, `medium`, `long_running`, `no_trade`. |
| Entry trigger horizon | How quickly the initial alert/entry evidence decays. | `entryTriggerHorizon` | Separate from holding horizon; a 30-second trigger can still start a longer thesis only when HTF/mid-TF context supports it. |
| Holding horizon | How long the trade thesis is expected to remain valid after entry. | `holdingHorizon` | Used to classify fast, medium, and long-running trades. |
| Fast trade | LTF-driven trade with expected hold from seconds to 30 minutes. | `fastTrade` | Volume velocity and wick shock usually belong here unless higher context upgrades the idea. |
| Medium trade | Intraday trade with expected hold from 30 minutes to 8 hours. | `mediumTrade` | Requires mid-TF setup plus LTF trigger; should not rely on volume velocity alone. |
| Long-running trade | HTF-led trade with expected hold from 8 hours to multiple days or weeks. | `longRunningTrade` | LTF trigger is entry timing only; thesis, invalidation, and exit logic must come from HTF/mid-TF context. |
| No-trade scenario | Explicit outcome where none of the trade classes has enough evidence. | `noTradeScenario` | Full TA must be allowed to conclude no trade. |
| Volume velocity | Sudden short-window volume/notional expansion relative to recent baseline. | `volumeVelocity` | Lower-timeframe trigger by default, not a complete trade thesis. |
| Scenario map | Set of plausible paths with evidence that would confirm or reject each path. | `scenarioMap` | Bullish, bearish, chop/no-trade, fakeout, and invalidation paths should be explicit. |
| Alert surface | User-visible channel where an alert is delivered. | `alertSurface` | Current default split: Telegram is compact; Obsidian/RALPH carries the full analysis record. |
| Alert summary | Compact Telegram alert content: what happened, trade class, thesis label, invalidation, and link/context pointer. | `alertSummary` | Should not pretend to contain every TA detail. |
| Full analysis record | Obsidian/RALPH page carrying the complete Full TA structure. | `fullAnalysisRecord` | Used for review, source memory, and later statistics. |
| Actionable alert | Telegram-worthy alert where Full TA finds a clean trade class and explicit invalidation. | `actionableAlert` | Default Telegram path. Still not financial advice or an execution command. |
| Research event | Interesting market event with incomplete or non-actionable trade thesis. | `researchEvent` | Default destination is Obsidian/RALPH, not Telegram. |
| Exceptional research sample | Non-actionable event worth timely human attention because it is rare, high-impact, or resolves an active unknown. | `exceptionalResearchSample` | May justify Telegram even without a clean trade. |
| Risk/context event | Event that matters for awareness or risk even if it is not a trade setup. | `riskContextEvent` | May justify Telegram when timely. |
| Autonomy class | Permission category for what RALPH may do without Tomas. | `autonomyClass` | Values: `alone`, `approval_required`, `forbidden_currently`. |
| Wheel gate | Prior-art and access check before custom data, backtest, prototype, or build work. | `wheelGate` | Prefer reuse, adapters, benchmarks, and public/no-key substitutes. |
| Access status | Whether a source/tool is actually usable in this workspace now. | `accessStatus` | Values: `active`, `proposed`, `watch`, `needs_approval`, `inaccessible`. |
| Demo trading | Non-real-money trading practice through local paper simulation, public-data forward paper, or explicitly approved demo/testnet exchange tools. | `demoTrading` | Mandatory before any real-money proposal; demo/testnet accounts or keys still need HITL. |
| Evals | Repeatable checks that decide whether RALPH's outputs are improving or degrading. | `evals` | In RALPH this means data/evidence/process evals, not only AI benchmark evals. |
| Short command | One-word or short-phrase Tomas uses to steer RALPH with low cognitive load. | `shortCommand` | See `core/communication-protocol.md`. |

## Operations

| Term | Definition | Canonical spelling in code | Notes |
|------|------------|----------------------------|-------|
| Verify | Check concrete evidence, outputs, access, delivery, data quality, and test results. | `verify` | Successful command exit alone is not enough. |
| Reassess | Update confidence and route after new evidence or a failed path. | `reassess` | Should say whether confidence rose, fell, or stayed unchanged. |
| Dig laterally | Try another tool, source, API, repo, local cache, or smaller proxy test before declaring a limit. | `digLaterally` | Used when the direct path is shallow or blocked. |
| Maintain RALPH | Consolidate notes, repair routes, check links, clarify vocabulary, prune stale queues, and log decisions. | `maintainRalph` | Should happen before more features when the system feels confusing. |
| Demo trade | Run or prepare non-real-money paper/demo validation. | `demoTrade` | Local paper is agent-alone when no keys/accounts are needed; demo/testnet exchange setup needs HITL. |
| Grill-me | Focused interview to resolve unclear goals, terms, constraints, and design branches. | `grillMe` | For trading/funds-adjacent work, unresolved terminology blocks implementation. |
| Search before build | Run source/tool/framework checks before writing custom machinery. | `searchBeforeBuild` | Date-stamp and cite checks. |
| Split alert surface | Put a compact summary in Telegram and the detailed Full TA in Obsidian/RALPH. | `splitAlertSurface` | Default for avoiding noisy alerts while preserving evidence. |
| Suppress non-actionable event | Write an interesting but non-actionable event to Obsidian/RALPH without Telegram delivery. | `suppressNonActionableEvent` | Default when Full TA says no clean trade. |
| Run wheel gate | Check existing tools, datasets, APIs, repos, papers, dashboards, and local access before custom work. | `runWheelGate` | Required before custom data collection, backtest expansion, prototype, or build. |
| Require approval | Stop and ask Tomas before an action that changes external, paid, live, or user-visible behavior. | `requireApproval` | Approval must be specific to the proposed change. |

## Events

| Term | Definition | Canonical spelling in code | Notes |
|------|------------|----------------------------|-------|
| Alert sent | Watcher delivered a user-visible alert. | `alert_sent` | Must be separable from paper outcome and real execution. |
| Event logged | Watcher/RALPH recorded an interesting event internally without user-visible alert. | `event_logged` | Preferred for non-actionable research events. |
| Paper/shadow alert | Alert with no matched execution, evaluated as paper/shadow evidence only. | `paperShadowAlert` | Separate bucket from actual Tomas trades. |
| Exact-follow execution | Actual execution that matches the alert plan closely enough to evaluate the plan itself. | `exactFollowExecution` | Needs tolerance rules. |
| Modified-alert execution | Actual execution inspired by an alert but changed by Tomas or execution conditions. | `modifiedAlertExecution` | Evaluates operator modification, not pure alert quality. |
| Manual-independent execution | Actual execution not attributable to a RALPH alert. | `manualIndependentExecution` | Useful baseline for Tomas's own trading. |
| Source audit | Bounded pass that classifies tools, sources, frameworks, docs, repos, and APIs by usefulness and access. | `sourceAudit` | Should update RALPH routes instead of becoming a loose chat summary. |
| Source sufficiency | Minimum source/access evidence before a claim can drive a strategy test or build. | `sourceSufficiency` | Default: at least 3 relevant independent sources for T1, with primary/official sources preferred and access verified. |
| Approval-required action | Change that needs Tomas before proceeding. | `approvalRequiredAction` | Includes paid APIs, accounts, keys, live execution, alert wording/delivery changes, recurring jobs, public posting, or large repo changes. |
| Agent-alone action | Work RALPH may do without approval. | `agentAloneAction` | Includes reading local notes, maintaining Obsidian/RALPH files, source search, public/no-key checks, local statistics, paper/shadow analysis, and draft proposals. |
| Currently forbidden action | Action outside current RALPH scope. | `currentlyForbiddenAction` | Includes live autonomous order placement, wallet-key handling, credential storage in research vaults, and public posting without approval. |
| Alert quality | How well the alert's own thesis and plan perform under its declared trade class. | `alertQuality` | Should be judged first on paper/shadow and exact-follow buckets, not modified/manual buckets. |
| Operator modification quality | Whether Tomas's changes improved or worsened an alert-derived plan. | `operatorModificationQuality` | Evaluated only in modified-alert executions. |
| Manual baseline | Tomas's independent trade outcomes used as comparison context. | `manualBaseline` | Evaluated separately from RALPH alert quality. |

## Synonyms to kill

| Variations found | Preferred term | Reason |
|------------------|----------------|--------|
| full analysis, full TA, full technical analysis | Full TA | One canonical term for the alert/research contract. |
| timeframe, TF | Timeframe | Use only for chart/data resolution; use `entry trigger horizon` or `holding horizon` when discussing trade duration. |
| lower timeframe, low TF, LTF | LTF trigger | Make clear this is execution evidence, not the whole thesis. |
| big picture, macro chart, higher timeframe | HTF context | Avoid vague chart commentary. |
| source search, wheel scan, prior-art check | Wheel gate | One gate before build/custom expansion. |
| paper alert, shadow alert, unexecuted alert | Paper/shadow alert | Keep non-executed outcomes separate from real trades. |
| fast scalp, quick trade, violent-move trade | Fast trade | Trade class, not a guarantee of speed or profitability. |

## Homonyms to disambiguate

| Shared term | Contexts it appears in | Proposed renames |
|-------------|------------------------|------------------|
| Alert | Event notification vs trade recommendation | Use `alert` for the message and `strategy candidate` for tested edge. |
| Signal | Raw trigger vs validated edge | Use `trigger` for raw event; use `candidate` only after explicit hypothesis. |
| Shadow | Paper alert outcome vs wallet shadowing | Use `paper/shadow alert` for alert journal; use `wallet shadowing` for copying/following wallets. |
| Execution | Real exchange fill vs simulated fill | Use `execution` for real captured fill; use `paper fill` for simulated result. |
| Demo | Local paper simulation vs exchange demo/testnet account | Use `local paper` for no-account simulation; use `demo/testnet` when an exchange/broker account or API key is involved. |
| Full TA | Verbose alert text vs multi-timeframe scenario map | Use `Full TA` only when it includes HTF, mid-TF, LTF, alternatives, invalidation, and trade-class fit. |
| Alert | Compact Telegram summary vs full Obsidian record | Use `alert summary` and `full analysis record` when the distinction matters. |
| Interesting | Useful for research vs worth interrupting Tomas | Use `research event` for internal notes and `actionable alert` or `risk/context event` for Telegram. |

## Terms I am guessing about

| Term | What I think it means | Need confirmation |
|------|-----------------------|-------------------|
| Source sufficiency | Enough sources means no obvious wheel is ignored and at least 3 independent relevant sources exist at T1. | Treat this as default unless Tomas later makes it stricter. |
