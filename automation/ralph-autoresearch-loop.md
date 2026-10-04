# RALPH Autoresearch Loop

Status: approved, active.

## Contract

Run RALPH as an independent recurring research loop, not as a real-money trading executor.

The active research/paper operating contract is `core/profitability-flywheel.md` (`RALPH Profitability Flywheel`). Every selected item should flow through Intake, Wheel gate, Hypothesis, Kill test, Forward paper when justified, Postmortem, Decision, Memory, and Reassess. This formalization does not expand approval for real-money trading, keys, paid services, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, or execution changes.

Tomas wants the loop to act as if it is managing capital and trying to become profitable, even while the current capital is simulated. Treat paper/DEMO-SIM as a serious capital audition: net PnL after fees, drawdown, sizing, risk of ruin, survivability, and whether the trade would deserve real money matter more than novelty. Research is the method; profit is the objective.

The loop must be isolated from the Telegram main session so Tomas's no-compaction preference is preserved. It should use local RALPH state, public/free sources, and existing installed skills before proposing anything new.

Hard rule from Tomas: do not reinvent the wheel. Before expanding custom data collection, backtesting, strategy experiments, or prototypes, run the prior-art/wheel gate in `rules.md`, `core/testing-protocol.md`, and `wiki/concepts/prior-art-before-experiment.md`.

Standing rule from Tomas: run your own statistics, then Verify and Reassess. If a direct route fails, find another route via MCP/tool discovery, public APIs, existing repos/frameworks, local cache, or a smaller proxy test before calling the work blocked.

Standing output rule from Tomas: autoresearch is for the agent, not for Tomas. The loop may self-test, backtest, paper-trade, shadow-trade, and use demo/dry-run tooling to validate ideas, but normal results stay internal. Tomas only wants the loop if he asks for it, or when it finds something genuinely significant.

## Schedule

- Cron name: `ralph-autoresearch-loop`
- Cadence: daily at 09:30 Europe/Prague
- Session target: isolated
- Delivery: none
- Telegram target for rare notifications: Tomas direct chat `1539856256`

## Startup

1. Keep context small. Do not reread broad startup memory unless needed.
2. If `session_status` is available, check it early and avoid compaction-heavy work.
3. Read the compact retrieval router before broad scans:
   - `core/profitability-flywheel.md`
   - `automation/retrieval-router.yaml`
   - `core/indexing-token-budget.md`
4. Read only the project state needed for the run:
   - `index.yaml`
   - `index.md` if needed
   - `core/navigation.md`
   - `automation/work-queues.yaml`
   - `automation/loop-state.yaml`
   - the selected loop file under `loops/`

## Work Selection

Pick one bounded item from these lanes:

- strategy research
- framework/repo discovery
- X/GitHub public research
- operator/profile/community inspiration from GitHub, X/Twitter, Reddit, blogs, and public dashboards
- market/battlefield research
- copytrading and wallet-following source research
- self-improvement of RALPH loops and scoring
- paper/demo/dry-run validation tooling

### Controlled Strategy-Spam Lane

`strategy-spam-funnel` is an approved owned mode inside this existing autoresearch loop. It is not a separate cron.

Use it only when no higher-priority ready-now branch exists, or when Tomas explicitly asks for strategy-spam continuation. Default cadence is at most weekly. The recurring run must use:

```bash
npm run study:strategy-spam-funnel:recurring --prefix ralph-research-os/experiments/strategy-destruction-filter
```

Rules:

- keep the batch bounded to the recurring profile, target 100-300 variants;
- run one surface/mode batch, then stop;
- keep outputs separate from `candidates/seed-strategies.json`;
- do not import or promote survivors automatically;
- if a survivor appears, run `npm run study:strategy-spam-survivor-stress --prefix ralph-research-os/experiments/strategy-destruction-filter` before any candidate wording;
- normal output stays internal unless Tomas asks or a genuine HITL candidate decision appears.

Prefer items already present in `automation/work-queues.yaml`. Current priority is the strategy-destruction filter: make the filter harder to fool with out-of-sample splits, baseline comparison, deflated-Sharpe calibration, and a plain-English idea-spec schema. Alert-edge/orderflow work remains useful only when it feeds the filter or repairs data quality. Copytrading/wallet-following is now a first-class source lane under the same rule: existing tools and public profiles first, independent shadow/paper validation second, no live copying. Operator/profile/community research is also first-class: GitHub, X/Twitter, Reddit, blogs, public dashboards, and product docs can inspire ideas, but every idea must be reduced to a source-backed claim, mechanism, data need, failure mode, and cheapest kill test before it becomes a candidate. Do not restart old investigations from scratch; continue from the current queue and notes.

Before creating custom implementation work, ask whether an existing framework, public dataset/API, dashboard, repo, notebook, or paper already solves the same problem. Prefer reuse/adapters/benchmarks over custom code. If custom work remains necessary, record the exception.

## Autoresearch Core Cycle

For alert-edge and strategy-destruction work, the default loop is:

1. Collect finalized alert/review rows.
2. Join alert, review, local market context, and any available replay artifacts.
3. Clean data quality before judging edge.
4. Bucket by mechanism, market, direction, trigger label, score, and tradeability.
5. Run the cheapest available kill test first.
6. Update shadow PnL for tradable alert plans before considering paper promotion.
7. Update replay coverage: candles-only, `aggTrades`, trades+book, or hftbacktest-ready.
8. Promote only to watch/candidate/paper/live through explicit gates and required HITL.
9. Record why rejected ideas failed so future runs do not repackage the same weak mechanism.

Obsidian is the knowledge and review layer for this loop, not the backtest engine. Durable notes under `wiki/notes/` or `wiki/sources/` must be ingested into the OpenClaw bridge wiki and search-verified so they are available in Obsidian-rendered retrieval.

Self-improvement is an approved research lane. It may tighten gates, improve templates, add validation checks, or update queue prioritization. It must not loosen hard safety constraints, enable paid/keyed access, change live alert wording, or change execution behavior without Tomas explicitly approving the exact change. API keys are not inherently forbidden: read-only, demo/testnet, market-data, and research credentials can be useful when Tomas explicitly approves the access purpose and safe credential path. Live write/trading credentials remain a separate explicit approval boundary.

Copytrading/wallet-following research is allowed only as a watch/shadow/paper source lane. A run may inspect public dashboards, docs, repos, and no-key read APIs; record candidates in `decisions/copytrading-watch-ledger.md`; and write forward-test specs. It must not create live copy rules, agent wallets, exchange accounts, keys, paid API access, position sizing, TP/SL, execution behavior, alert wording, watcher behavior, or new cadence.

Operator/profile/community research is allowed only as a read-only inspiration and prior-art lane. A run may inspect public GitHub repos/issues/PRs, public X/Twitter or Reddit pages found through web search, blogs, docs, and public dashboards. It must not automate logins, bypass rate limits, scrape against terms, send messages, post publicly, enable paid APIs, create API keys, or treat social claims as evidence without code/data/source-backed validation.

## Micro-Run Budget

Recurring runs must stay small:

- choose exactly one work item
- read router/index plus only directly relevant notes
- use at most 4 new web/source checks unless the selected item is explicitly a source scan
- avoid long package installs or framework setup inside the recurring loop; write a bounded spike instead
- produce at most one durable note plus the smallest router/queue update
- stop early with a blocker note if the work threatens the timeout

If a manual or scheduled run times out, the next loop should first narrow the selected item or split it into smaller queue entries.

## Allowed Sources

- Local RALPH files
- Existing local skills and runbooks
- Public/free web pages
- Public GitHub repositories and official documentation
- Read-only local research artifacts
- Public/no-key dry-run or paper-trading frameworks when used without live execution

## Forbidden Actions

- Unapproved live trading
- Autonomous orders
- Wallet-key handling
- Unapproved exchange-account setup
- Paid APIs or paid infrastructure without explicit approval
- Public posting or publishing
- Installing, applying, or enabling a skill without explicit approval
- Saving credentials, cookies, wallet keys, exchange keys, or session secrets
- Scheduler, cadence, delivery, live alert wording, threshold, risk/sizing/TP/SL, or execution changes without explicit per-action approval

Demo/testnet exchange accounts, API keys, or broker/exchange integrations require separate explicit approval. Read-only/account-history, market-data, demo/testnet, and research keys may be used when Tomas approves the exact purpose and credential path. Local paper trading, historical backtests, public-data forward tests, and no-key dry-run simulations are allowed. Demo/paper trading is mandatory before any real-money proposal.

## Output Rules

Every run must leave a small, useful trace:

- update relevant notes, candidates, unknowns, discards, queues, or `log.md`
- update the smallest relevant index/router so future runs do not reread broad context
- if the run creates or materially updates a durable Markdown note under `wiki/notes/` or `wiki/sources/`, ingest that exact note into the main OpenClaw Obsidian-rendered bridge wiki with `openclaw wiki ingest <path> --title "RALPH <short title>" --json`, then verify it with `openclaw wiki search "<short title>" --max-results 3 --json`
- classify output under `core/loop-output-policy.md`
- keep generic summaries out of the wiki
- cite source URLs for new source-backed claims when applicable

## Self-Verification

Before ending, run a self-check:

- did the run stay inside the allowed action set?
- did it use public/free sources only?
- did it avoid financial advice and execution instructions?
- did it update the right RALPH files?
- did it start from the retrieval router/index and keep context selective?
- did it update the relevant index/router for any durable output?
- did it ingest and search-verify any new or materially updated durable Markdown note in the main OpenClaw bridge wiki?
- did it avoid duplicating existing notes?
- did it run the prior-art/wheel gate before custom build/data/backtest expansion?
- did it run or update its own statistics where the work touched alerts/strategies?
- did it explicitly Verify/Reassess the result and confidence?
- if something failed, did it try a reasonable alternate route or document the blocker?
- did every promoted claim have enough evidence?
- should Tomas be messaged under the notification rules?

Record the self-check in the run note or log entry.

## Notification Rules

Do not message Tomas for normal completed runs.

Message Tomas only when one of these is true:

- a candidate is promoted and needs a human go/no-go decision
- a high-value unknown needs Tomas's judgment
- the same blocker repeated 3 consecutive runs
- a market event creates a strong research sample worth timely attention
- a concrete alert-worthy setup or urgent event needs his attention
- Tomas explicitly asks for the autoresearch output

Default style when Tomas asks for output: short summary and significant things only; skip process detail and filler.

When messaging, keep it Czech, short, and explicit. Use Telegram `message(action="send", channel="telegram", target="1539856256")`.

## Failure Handling

On failure:

1. Record the failure in `log.md`.
2. Add or update the blocker in `automation/work-queues.yaml`.
3. Increment or preserve evidence of repeated blockers in `automation/loop-state.yaml`.
4. After 3 consecutive occurrences of the same blocker, message Tomas with the blocker and the smallest useful decision he can make.
