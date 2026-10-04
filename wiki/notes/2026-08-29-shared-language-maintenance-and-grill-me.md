---
type: note
name: Shared Language Maintenance And Grill-Me
created: 2026-08-29T11:58:00Z
last_updated: 2026-08-29T14:00:00Z
sources:
  - docs/ubiquitous-language.md
  - wiki/concepts/multi-timeframe-full-ta.md
  - wiki/concepts/prior-art-before-experiment.md
  - wiki/concepts/tool-first-not-build-first.md
  - core/testing-protocol.md
  - automation/current-operating-map.md
tags:
  - ralph
  - research-note
  - misc-research
---

# Shared Language Maintenance And Grill-Me

Tomas flagged three system risks:

- RALPH may be calling lower-timeframe volume-velocity triggers "full TA" when they are only LTF execution evidence.
- RALPH may still reinvent wheels if it does not search existing tools, sources, repos, dashboards, papers, and APIs before custom work.
- Tomas and the agent need a shared language so future conversations do not overload words like alert, signal, full TA, shadow, execution, fast trade, and source.

## Maintenance Result

Created `docs/ubiquitous-language.md` as the RALPH-level shared vocabulary and `wiki/concepts/multi-timeframe-full-ta.md` as the canonical Full TA concept page.

The key distinction:

- Volume velocity is an LTF trigger by default.
- Full TA requires HTF context, mid-TF setup, LTF trigger, scenario alternatives, invalidation, and trade-class fit.
- Fast, medium, long-running, and no-trade outcomes must be separated because they use different evidence and management rules.
- Timeframe means chart/data resolution; entry trigger horizon and holding horizon are separate terms.

## Wheel Gate Check

Existing RALPH rules already require prior-art/wheel checks before custom data collection, backtest expansion, prototype, or build. Current canonical pages:

- [[wiki/concepts/prior-art-before-experiment]]
- [[wiki/concepts/tool-first-not-build-first]]
- [[core/testing-protocol]]
- [[rules]]

Fresh primary-source spot check on 2026-08-29:

- Freqtrade official docs include `lookahead-analysis` for detecting lookahead bias: https://www.freqtrade.io/en/stable/lookahead-analysis/
- vectorbt official site describes an end-to-end vectorized backtesting pipeline: https://vectorbt.dev/
- NautilusTrader official docs describe backtesting with the same core components used in live trading: https://nautilustrader.io/docs/latest/concepts/backtesting/
- Jesse official site/docs advertise crypto strategy research, backtesting, paper/live trading, and rule significance testing: https://jesse.trade/ and https://docs.jesse.trade/

Reassessment: RALPH has the wheel rule on paper, but it should surface the wheel gate earlier in daily work. Before new custom alert, backtest, or execution-adjacent implementation, the agent should explicitly say which existing tool/source was checked and why custom work remains justified.

## Grill-Me Branches

Open branches for Tomas:

- Trade classes: exact definitions of fast, medium, and long-running trades.
- Alert surface: how much Full TA belongs in Telegram vs Obsidian.
- Source sufficiency: what counts as enough search before a test or build.
- Autonomy: what RALPH may do alone versus what always needs Tomas approval.
- Evaluation: whether alert quality is judged by paper/shadow outcome, exact-follow execution, modified-alert execution, manual-independent comparison, or all four separately.
- Maintenance cadence: whether RALPH should pause after significant alert/journal changes for vocabulary/link/source hygiene.

## Trade-Class Defaults

Tomas asked the agent to correct the draft ranges itself. Default canonical ranges:

- Fast trade: expected hold from seconds to 30 minutes; LTF trigger can be central; strict no-chase and timeout.
- Medium trade: expected hold from 30 minutes to 8 hours; requires mid-TF setup plus LTF trigger.
- Long-running trade: expected hold from 8 hours to multiple days or weeks; requires HTF thesis and explicit hold/exit conditions.
- No trade: explicit Full TA outcome when the scenario map is not actionable.

Next grill-me parent branch: decide the alert surface split between Telegram and Obsidian/RALPH.

## Alert Surface Default

Conservative default until Tomas overrides it:

- Telegram alert summary: compact, readable, and honest about confidence; should include event, trade class, thesis label, invalidation, and strongest blockers.
- Obsidian/RALPH full analysis record: complete Full TA, scenario map, source/wheel notes, paper/shadow result, and execution comparison.
- If Full TA is incomplete, Telegram should say which layer is missing instead of implying that an LTF trigger is a complete thesis.

## Non-Actionable Event Default

The agent answered the grill-me branch conservatively:

- If Full TA finds an interesting event but no clean trade, do not send a normal Telegram alert.
- Log it to Obsidian/RALPH as a research event.
- Telegram is still allowed for exceptional research samples or risk/context events when timely human awareness matters.
- This is an operating-language default only; it does not change watcher delivery gates until Tomas explicitly approves an alert-surface change.

## Source Sufficiency Default

Default for strategy/build/execution-adjacent work:

- Before custom data collection, backtest expansion, prototype, or build, run the wheel gate.
- T1 evidence should include at least 3 relevant independent sources when available.
- Prefer primary/official sources: docs, repos, papers, exchange/API docs, public dashboards with provenance, and local experiment outputs.
- Classify every useful source/tool by access status: active, proposed, watch, needs approval, or inaccessible.
- If fewer than 3 sources exist, the output must say why and use the cheapest proxy test instead of pretending the search was enough.
- LLM agreement is not independent evidence unless backed by sources or statistics.

## Autonomy Default

Default permission language:

- Agent alone: read local RALPH/OpenClaw notes, maintain Obsidian pages, update vocabulary/routing/logs, run public/no-key source checks, run local statistics/backtests over existing public or local data, paper/shadow analyze, and draft proposals.
- Approval required: paid APIs, account setup, API keys, subscriptions, package installs that become dependencies, live alert wording/delivery changes, recurring job creation or cadence changes, risk/sizing/TP/SL changes, large repo changes, public posting, and anything that could affect Tomas's real trading behavior.
- Forbidden currently: autonomous live order placement, wallet-key handling, storing credentials/secrets in research vaults, bypassing access controls or rate limits, and treating unverified LLM consensus as evidence.

Default bias: when uncertain, downgrade to approval-required and record the uncertainty.

## Evaluation Bucket Default

Default outcome accounting:

- Paper/shadow alert: judges the alert plan when no execution is matched. Main high-volume evidence bucket.
- Exact-follow execution: judges the alert plan under real fills when Tomas followed it closely.
- Modified-alert execution: judges Tomas-plus-alert interaction; do not count it as pure alert quality.
- Manual-independent execution: judges Tomas's manual baseline; do not count it as RALPH alert quality.

Default metric rule: alert quality can use paper/shadow and exact-follow buckets first. Modified-alert and manual-independent buckets are comparison layers, not proof that the alert itself was right or wrong.

## Boundaries

No live trading, orders, keys, paid APIs, account setup, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, or execution behavior changed.
