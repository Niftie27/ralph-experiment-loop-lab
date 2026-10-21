# Ubiquitous language

Last updated: 2026-10-20

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
| Trade class | Alert TA holding-period family used by the watcher and Full TA. | `tradeClass` | Canonical values: `fast`, `medium`, `long_running`, `no_trade`. Alerts only; the factory's cost classes are the strategy class. |
| Entry trigger horizon | How quickly the initial alert/entry evidence decays. | `entryTriggerHorizon` | Separate from holding horizon; a 30-second trigger can still start a longer thesis only when HTF/mid-TF context supports it. |
| Holding horizon | How long the trade thesis is expected to remain valid after entry. | `holdingHorizon` | Used to classify fast, medium, and long-running trades. |
| Fast trade | Alert trade class with expected hold from seconds to 30 minutes. | `fastTrade` | Alert TA only, not the factory's fast scalp class. Volume velocity and wick shock usually belong here unless higher context upgrades the idea. |
| Strategy class | Factory cost class of a strategy by holding time: intraday and swing (minutes to days, F1), fast scalp (seconds, later), HFT (sub-second, out of F1). | not in code yet | Sets the backtest cost model (spec "Robust evaluation", I52); a class whose round-trip cost exceeds its typical target cannot exist. Not the alert `tradeClass`. |
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

## Data identity and factory (F1)

Sources: [factory spec F1](factory-spec-f1.md), [F1a-1 data identity](f1/f1a-1-identity.md) and the code in `experiments/strategy-destruction-filter`.

| Term | Definition | Canonical spelling in code | Notes |
|------|------------|----------------------------|-------|
| Instrument | The traded series a snapshot or registry row belongs to: exchange, market type and contract together. | `instrument` | Part of every snapshot key and registry identity, so spot data never answers a futures request or the reverse. Resolved from the symbol's provider config; stored records are read with `instrumentOf`. |
| Exchange | Venue that publishes the market data. | `exchange` | Values today: `binance`, `bybit`. |
| Market type | Instrument class on the exchange. | `market` | Values: `spot`, `linear_perpetual` (USDT-margined perpetual: Binance USD-M and Bybit linear, told apart by exchange). Same values as a candidate's `dataRequirements.markets`. |
| Contract | The exchange's instrument symbol: a spot pair or a derivative contract. | `contract` | Example `BTCUSDT`; defaults to `<SYMBOL>USDT`. |
| Manifest | List of frozen series: symbol, instrument, timeframe, window, snapshot file, first and last candle, count and SHA-256. | `manifest` | `results/manifest-h2.json`. Entries are added, never changed. |
| Legacy record | Manifest entry, registry row or queue item written before F1a-1, without exchange, market type or contract. | not in code yet | Read as Binance spot `<SYMBOL>USDT` and never rewritten: the 2 H2 manifest entries, 400 registry rows and 398 H3a queue items. |
| Snapshot | Frozen, content-addressed candle series for one symbol, instrument, timeframe and window; the file name is its SHA-256. | `snapshot` | Written once, read-only. A changed source checksum creates a new snapshot, never an overwrite. |
| Base source | Binance Vision file that the unit plan assigns to a 1m unit: the monthly file of its month, or one of the daily files 2026-10-01..16. | `unit.sources` (`planUnits`) | Only base sources are listing evidence and first files. A missing base source is a gap or not_listed. Contract amendment round 5. |
| Fill source | Daily Vision file of a day on which the unit's verified monthly file lacks an accepted candle; derived only from that monthly file and the unit bounds. | `fillSources` | Supplies the minutes the monthly file lacks (`filledRanges`) and must agree with the monthly rows on the rest of its day. Listed in the entry's `sources` when present; never listing evidence, never a first file. |
| Quarantined row | Kline row that passes every structural check but breaks one of the seven value rules; it gives no candle and is recorded with its open time and the first broken rule, never its values. | `quarantinedRows` | More than 10 in one file fail every unit that uses the file. Quarantine alone sets no exit code. |
| Fill unavailable | Fill source for which Vision answered 404 on both the zip and its CHECKSUM (the 404 marker). | `dailyFill.unavailable`, `unavailableAtBuild` | Not a gap and no exit 3; reported by the run, never stored in the manifest. verify derives it from the entry (`unavailableAtBuild`). |
| Variant | One concrete parameter set of a candidate, expanded from its grid, on one symbol and timeframe. | `variant` | `variantId`; a queue item is exactly one variant. |
| Variant registry | Append-only log with one row per backtest run: identity (variant, parameters, symbol, instrument, timeframe, entry mode, costs, risk), period, manifest and engine hashes, metrics. | `registry` | `results/variant-registry.jsonl`; the identity comes from `identityFor`. Raw N is read from it from F1b on. |
| Trial | One counted evaluation of a distinct variant, pass or fail; an exact rerun is not a new trial. | `trialCount` | Raw N = trials in the full registry history across markets; the registry separates reserved grid size, evaluated unique trials and technical repeats. Today `trialCount` is a proxy: distinct variants in earlier reports plus the queued batch. |
| Effective N | Number of independent trials, from clustering the correlation of trials' daily returns (López de Prado). | not in code yet | Reported beside raw N; the DSR bar uses it. |
| Family | Named group of related candidates and their variants. | `family` | Registry rows: `candidateFamily`; queue items: `sourceFamily`. A new hypothesis spec must differ from earlier ones by family or context. |
| Funnel | The six F1 stages a variant passes, one gate each: generate, sieve, robustness, holdout, realistic replay, demo-sim. | not in code yet | A variant moves on only through its gate; a rejection is final but stays in the registry. |
| Gate | Pass/fail condition a variant must meet to leave a funnel stage. | `gates` | Sieve gates today in `config.default.json`, e.g. min 80 trades, PF ≥ 1.15, expectancy ≥ 0.05 R, max drawdown 18 R. |
| Research window | Fixed period for all research runs: 2021-10-18 to 2025-10-17 (UTC, end exclusive). | `research` | `PERIODS.research`. Data after 2026-10-17 is sealed as the next forward test period; research windows never extend into it. |
| Holdout | Locked period 2025-10-17 to 2026-10-17, opened only for a frozen candidate with a pre-registration hash, one recorded look each, inside a fixed look budget. | `holdout` | `PERIODS.holdout`, `guardHoldout`. Today the guard checks only `--final` and a matching research registry row; F1c adds the rest. Look budget 5 (D7). |
| Pre-registration | Written record of a frozen candidate and its pass criteria, made before its holdout look; its hash is required for the look. | not in code yet | F1c enforces it in code. V6 has its own pre-registration document. |
| Walk-forward | Locked F1 protocol: choose on 12 months, test on the next 3, roll by 3 (12 test windows, 2022-10-18 to 2025-10-17), judged on the stitched out-of-sample result. | not in code yet | An expanding training window is the one locked sensitivity: reported, never used to choose. |
| Selection procedure | Family plus a selection rule fixed in advance that picks inside the training window only: the centre of a stable plateau, or nothing. | not in code yet | Walk-forward tests the procedure, not one variant. Its pick on the last 12 research months is the holdout candidate. |
| Null campaign | Research campaign of random strategies run through the whole funnel to measure the false-pass rate. | not in code yet | Hundreds are run; the false-pass rate must be ≤ 5 % (D4). |
| Planted edge | A known edge built into a test so that the evaluation must find it. | not in code yet | F1b acceptance; how it is planted is not specified yet. |
| Deflated Sharpe ratio (DSR) | Sharpe ratio corrected for the number of trials, computed on daily equity returns. | not in code yet | Pass bar: DSR ≥ 0.95 on effective N (D4); economic gates stay necessary. |
| TA building block | Shared candle function (HTF trend, swings, SFP/sweep, key levels, fib, VWAP, volume profile, confluence score) used by the backtest and later by live code. | not in code yet | Each must pass a lookahead test; its parameters count as trials. |
| Entry style | How a variant enters once its setup is armed: `limit_at_level`, `confirm_close`, `confirm_sfp`, `confirm_bos`, `confirm_retest`, `next_open`, `signal_close`. | `entryMode` | Only `signal_close` and `next_open` exist in code; the others come in F1e on 1m bars. The entry style is its own variant axis. |
| Ambiguous fill | Trade whose stop and target both fall inside one bar; the stop counts first. | `stop-first-collision` | Spec name `ambiguous_fill` (1m bars) is not in code yet; the current engine marks the same case `stop-first-collision`. |

## Synonyms to kill

| Variations found | Preferred term | Reason |
|------------------|----------------|--------|
| full analysis, full TA, full technical analysis | Full TA | One canonical term for the alert/research contract. |
| timeframe, TF | Timeframe | Use only for chart/data resolution; use `entry trigger horizon` or `holding horizon` when discussing trade duration. |
| lower timeframe, low TF, LTF | LTF trigger | Make clear this is execution evidence, not the whole thesis. |
| big picture, macro chart, higher timeframe | HTF context | Avoid vague chart commentary. |
| source search, wheel scan, prior-art check | Wheel gate | One gate before build/custom expansion. |
| paper alert, shadow alert, unexecuted alert | Paper/shadow alert | Keep non-executed outcomes separate from real trades. |
| quick trade, violent-move trade | Fast trade | Alert trade class, not a guarantee of speed or profitability. "Fast scalp" is a strategy class, not a synonym. |
| entry mode, entry style | Entry style | Spec term; code keeps `entryMode` until F1e adds the new styles. |
| stop-first collision, ambiguous fill | Ambiguous fill | Spec name for the same stop-first rule on finer bars. |
| USD-M perpetual, USDT-margined perpetual, linear perp, perp | Linear perpetual (`linear_perpetual`) | One market type; the venue belongs in exchange. |

## Homonyms to disambiguate

| Shared term | Contexts it appears in | Proposed renames |
|-------------|------------------------|------------------|
| Alert | Event notification vs trade recommendation | Use `alert` for the message and `strategy candidate` for tested edge. |
| Signal | Alert raw trigger vs factory rule output (`signalForVariant` returns an array of `{direction, reason}` objects, possibly empty, at a closed bar; `signalGate` may veto a signal) vs validated edge | Alerts: `trigger` for the raw event. Factory: `signal` is a variant's rule output at a closed bar and `signalGate` a context filter (see Gate). Neither is an edge; `candidate` only after an explicit hypothesis. |
| Shadow | Paper alert outcome vs wallet shadowing | Use `paper/shadow alert` for alert journal; use `wallet shadowing` for copying/following wallets. |
| Execution | Real exchange fill vs simulated fill (alert journal or backtest) | `execution` only for a real captured fill; `paper fill` for a simulated alert outcome; `backtest fill` for a factory fill rule (fill rate, `limit_at_level`, `ambiguous_fill`). "Fill" inside a backtest spec means backtest fill. |
| Fast | Alert trade class `fast` (seconds to 30 min) vs factory strategy class fast scalp (seconds, maker fees and limit fills only) | `fast trade` for the alert class, `fast scalp` for the strategy class. |
| Demo | Local paper simulation vs exchange demo/testnet account | Use `local paper` for no-account simulation; use `demo/testnet` when an exchange/broker account or API key is involved. |
| Full TA | Verbose alert text vs multi-timeframe scenario map | Use `Full TA` only when it includes HTF, mid-TF, LTF, alternatives, invalidation, and trade-class fit. |
| Alert | Compact Telegram summary vs full Obsidian record | Use `alert summary` and `full analysis record` when the distinction matters. |
| Interesting | Useful for research vs worth interrupting Tomas | Use `research event` for internal notes and `actionable alert` or `risk/context event` for Telegram. |
| Family | Candidate family (`family`, `candidateFamily`) vs rule family in the H3a queue report (`perFamily`, "Counts by rule family", keyed by the eight rules) | Use `family` for the candidate family and `rule` for the eight rule names. |
| Walk-forward | F1 rolling 12/3/3 selection protocol vs existing diagnostic folds (`walkForward`, `walkForwardDiagnostics`: 5 equal-trade-count chronological folds over existing trades, no re-selection) | Use `walk-forward` for the F1 protocol and `diagnostic folds` for the existing split. |
| Deflated Sharpe | DSR on effective N from daily returns (F1 bar) vs `deflatedSharpe` (per-trade multiple-testing proxy, gate 0.35) | Use `DSR` for the F1 bar and `deflated-Sharpe proxy` for the existing value. |
| Gate | Pass/fail condition of a funnel stage (`gates`) vs signal filter (`btc_regime_gate`, `signalGate`) vs wheel gate | Use `gate` for pass/fail conditions, `context filter` for signal filters, `wheel gate` as defined above. |
| Funnel | F1 six-stage funnel vs the earlier strategy spam funnel (`run-strategy-spam-funnel.mjs`, a first-pass grid study) | Use `funnel` for F1 and `spam funnel` for the earlier study. |
| Candidate | Strategy candidate (hypothesis with parameter grids, `candidate`) vs holdout candidate (one frozen variant picked by the selection procedure) | Use `frozen candidate` for the holdout case. |
| Out-of-sample | Last 30 % of the research window in the 70/30 split (`outOfSample`) vs walk-forward test windows vs holdout | Use `out-of-sample split`, `test window` and `holdout` respectively. |
| Snapshot | Frozen content-addressed series vs offline raw inputs (`snapshotInputs`) that get frozen into one | Use `snapshot` only for frozen bytes; call `snapshotInputs` offline inputs. |
| Fill | Archive gap fill (a minute a monthly 1m unit takes from a daily Vision file: fill source, `filledRanges`) vs execution or backtest fill of a trade (see Execution and Ambiguous fill) | Use `daily fill`, `fill source` and `filled minutes` for the archive case; `execution`, `paper fill` and `backtest fill` for trades. |

## Terms I am guessing about

| Term | What I think it means | Need confirmation |
|------|-----------------------|-------------------|
| Source sufficiency | Enough sources means no obvious wheel is ignored and at least 3 independent relevant sources exist at T1. | Treat this as default unless Tomas later makes it stricter. |
| Planted edge | An edge deliberately built into a test series or strategy that a sound evaluation must find; the spec names only the acceptance ("a planted edge is found"). | How it is planted (synthetic series, injected returns or a known strategy) is to be fixed in F1b. |
