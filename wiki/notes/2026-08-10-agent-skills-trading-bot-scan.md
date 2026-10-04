---
type: note
name: Agent Skills Trading Bot Scan
sources:
  - https://github.com/agiprolabs/claude-trading-skills
  - https://github.com/crypto-com/crypto-agent-trading
  - https://github.com/base/demos/blob/master/agents/trading-agent/SKILL.md
  - https://arxiv.org/abs/2605.11418
tags:
  - ralph
  - research-note
  - misc-research
related:
  - core/automation-policy.md
  - loops/strategy-research-loop.md
  - loops/framework-repo-discovery-loop.md
  - wiki/notes/2026-07-01-trading-bot-build-guide-map.md
created: '2026-08-10T21:55:00Z'
last_updated: '2026-08-10T22:13:23Z'
---

# Agent Skills Trading Bot Scan

Tomas asked whether RALPH should be running recurring autoresearch as a second brain and whether there are useful agent skills for crypto trading and trading-bot construction.

## Local State

- RALPH is already structured for this: `strategy-research`, `framework-repo-discovery`, `x-github-research`, and `market-battlefield` loops exist.
- Pre-activation finding: recurring automation was not active yet and approval was required before cron/systemd.
- Post-activation state: Tomas approved A2 `ralph-autoresearch-loop` on 2026-08-10. The active OpenClaw cron job runs Monday and Thursday at 09:30 Europe/Prague in isolated sessions with delivery `none`.
- `core/automation-policy.md` allows public/free research and wiki updates, but requires explicit approval for recurring jobs, paid APIs, accounts, or background workers.
- OpenClaw wiki status shows an isolated wiki in Obsidian render mode, but the official Obsidian CLI is not available on PATH. The RALPH directory itself remains Obsidian-friendly markdown.

## Local Skill Audit

Current useful local skills for RALPH:

- `research`: existing AI Research OS workflow for query/append/deep/init research directories.
- `research-lint`: health-checks research directories; user-triggered only, never automated by its own rules.
- `research-render`: turns wiki pages into decks, charts, canvases, or briefs.
- `research-distill`: compiles used research sources into a compact `research.md`.
- `obsidian-vault-maintainer` and `obsidian`: Obsidian-aware note handling; currently limited because Obsidian CLI is missing.
- `wiki-maintainer`: OpenClaw memory wiki maintenance with source-backed updates and linting.
- `taskflow`: durable multi-step background jobs with state and child tasks; useful for RALPH loops that outlive one turn.
- `blogwatcher`: RSS/Atom monitoring; useful for protocol blogs, security feeds, framework releases.
- `github`: GitHub CLI workflows for repo discovery, issues, releases, and API queries.
- `spike`: throwaway prototypes for feasibility tests before committing to a bot architecture.
- `ai-coding-operating-rhythm`, `grill-me`, `improve-architecture`, and `ubiquitous-language`: useful when RALPH crosses from research into design/prototype work.

Missing locally:

- no first-party crypto-trading skill;
- no installed Bybit trading skill as a reusable local skill, only the inspected OAuth helper and custom read-only journal scripts;
- no dedicated backtesting-framework skill for Freqtrade, NautilusTrader, Jesse, Hummingbot, or Hyperliquid;
- no active Obsidian app/CLI bridge.

Implication: RALPH should compose existing generic skills into a conservative research loop, then refine the pending `ralph-autoresearch` skill proposal after observing real scheduled runs.

## External Skill Candidates

| Candidate | Usefulness | Initial judgment |
| --- | --- | --- |
| `agiprolabs/claude-trading-skills` | Large collection of trading, DeFi, quant, backtesting, risk, and data-source skills. | Worth auditing as a source of workflows. Do not bulk-install before reviewing permissions and dependencies. |
| `crypto-com/crypto-agent-trading` | Exchange/app trading skills with balance/history/trade flows and kill-switch patterns. | Useful as an architecture and safety-reference source; less relevant operationally because Tomas uses Bybit. |
| `base/demos/agents/trading-agent/SKILL.md` | Scaffold for Base trading agents from a natural-language strategy. | Useful for agent/project scaffolding ideas, but wallet/execution oriented; keep away from live keys. |
| Bybit OAuth/Agent Connect skill previously inspected | Direct Bybit integration pattern with AI sub-account credentials. | Useful for read-only/account plumbing; execution permissions require strict human gate. |

## Risk Note

Third-party `SKILL.md` packages are executable operational guidance, not passive docs. Recent research on semantic supply-chain attacks against agent skill registries argues that skill metadata and instructions can influence discovery, selection, and governance. For RALPH, any external trading skill should be treated like code supply chain:

- inspect before install;
- prefer read-only and research workflows;
- do not grant wallet, exchange, trade, or withdraw capability by default;
- vendor only the minimum useful instructions into RALPH-owned skills/runbooks.

## Active Next Loop

Run the approved recurring A2 `ralph-autoresearch-loop`.

Minimum useful cadence:

- 2x weekly, not daily at first.
- Inputs: public GitHub skill repos, trading-bot frameworks, RALPH queues, current `crypto-updates` alert outcomes.
- Outputs: one concise note under `wiki/notes/`, candidate/unknown updates, and a Telegram summary only when something actionable changes.
- Stop condition: pause or ask Tomas only if the same blocker repeats 3 consecutive runs, safety scope needs expansion, or the signal/noise ratio becomes poor.

## First A2 Work Item

The first scheduled worker can audit `agiprolabs/claude-trading-skills` as a bounded public-source task:

1. list all skills by category;
2. identify read-only/research-only skills vs execution-capable skills;
3. shortlist at most 5 useful skills for RALPH;
4. reject or quarantine anything that pushes live trading, wallet keys, or unverified signal following;
5. write a decision memo: install, vendor ideas only, or ignore.

> Synthesis: RALPH now has the second-brain shape plus approved A2 scheduling. Do not jump straight to installing third-party trading skills; vendor ideas only after review.
