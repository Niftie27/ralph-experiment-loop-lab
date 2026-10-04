---
type: note
name: Operator Profile Community Autoresearch Lane
created: 2026-08-27T17:45:00Z
last_updated: 2026-08-27T17:45:00Z
tags:
  - autoresearch
  - github
  - x-twitter
  - reddit
  - strategy-discovery
sources:
  - https://docs.github.com/en/rest/search/search
  - https://docs.x.com/x-api/getting-started/pricing
  - https://www.redditinc.com/policies/developer-terms
related:
  - ../../loops/x-github-research-loop.md
  - ../../automation/ralph-autoresearch-loop.md
  - ../../automation/work-queues.yaml
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---

# Operator Profile Community Autoresearch Lane

Status: proposed first-class source lane for RALPH, research-only.

Tomas corrected the framing on 2026-08-27: the useful repeated autoresearch should not be limited to wallets or Hyperliquid profiles. RALPH should also watch public operator profiles, GitHub repos, X/Twitter discussions, Reddit threads, and similar community surfaces for reusable ideas, strategy patterns, tooling, and failure cases.

This is still "do not reinvent the wheel." The point is to learn from people and projects already exploring the terrain before writing new scanners, bots, strategy code, dashboards, or validation harnesses.

## What This Lane Looks For

The lane should collect and compare:

- GitHub repos, maintainers, issues, PRs, examples, notebooks, and strategy/backtest frameworks;
- X/Twitter operator profiles, threads, public post trails, market microstructure notes, and tool announcements;
- Reddit communities and threads where practitioners discuss failures, live constraints, tooling, exchange behavior, and strategy decay;
- public dashboards, docs, blog posts, and product pages that show existing workflows RALPH can reuse or benchmark against.

Useful output is not "copy this strategy." Useful output is:

- a source-backed idea;
- why an operator believes it works;
- what data it needs;
- what market regime it depends on;
- how it fails;
- whether an existing repo/tool already implements it;
- the cheapest falsification test RALPH can run.

## Access Check, 2026-08-27

| Surface | Workspace access observed | Useful role | Status |
| --- | --- | --- | --- |
| GitHub public repos | GitHub connector search returned public `freqtrade/freqtrade`, `freqtrade/frequi`, and `freqtrade/freqtrade-strategies`; public repo fetch is available. GitHub docs say REST search has custom rate limits and code search requires authentication. | Active source rail for repos, READMEs, examples, issues, PRs, and public strategy/framework prior art. | active read-only |
| GitHub broad profile discovery | Connector repo search works, but "which people matter" still needs seed queries and source ranking. | Discover maintainers/operators indirectly through repos/issues/docs. | watch/proposed |
| X/Twitter | Official X docs describe pay-per-usage credits and per-endpoint pricing. This workspace has web search, but no verified X API credits/account workflow for systematic reads. | Public/manual/web search source for threads and profiles; no automated X API loop yet. | watch/needs-access for API |
| Reddit | Reddit developer terms apply to API/developer-service usage. This workspace has web search, but no verified Reddit API app/token or paid/commercial data access. | Public/manual/web search source for community failure cases and operator discussion. | watch/needs-access for API |

## Intake Shape

Every sourced idea should be captured with:

| Field | Meaning |
| --- | --- |
| Source/person/project | Profile, repo, thread, subreddit, paper, dashboard, or product |
| Surface | GitHub, X/Twitter, Reddit, blog, docs, dashboard |
| Claim | The strategy/tool/process idea in plain language |
| Mechanism | Why it should work if true |
| Reuse path | Existing library, config, notebook, dataset, API, or manual pattern RALPH can borrow |
| Data needed | Market data, orderflow, fills, labels, on-chain flow, funding, social/event source |
| Falsification test | Cheapest local/public/no-key way to try to kill the idea |
| Failure modes | Overfit, latency, fees, slippage, hidden survivorship, paid-data dependence, market regime |
| Status | `watch`, `proposed`, `needs-access`, `rejected`, or `candidate` |

## Operating Rules

1. Profiles are not authorities. Treat them as idea sources that must survive RALPH validation.
2. Prefer GitHub repos/issues/examples first when available, because they expose code and failure discussion.
3. Use X/Twitter and Reddit as inspiration and weak evidence unless the source includes data, code, or repeatable examples.
4. Do not scrape, automate logins, bypass rate limits, or store private/profile-sensitive material.
5. Do not enable X/Reddit APIs, paid data vendors, third-party scraping providers, or new recurring cadence without Tomas's explicit approval.
6. Every idea must route to an existing lane: strategy destruction, orderflow, wallet/copytrading, framework/repo discovery, market battlefield, or self-improvement.
7. No strategy becomes a trade until it survives frozen rules, local/public data checks, realistic costs, and HITL approval.

## First Queue Items

- `discovery.operator-profile-source-map`: list high-signal public profiles/repos/communities by source surface and access status.
- `discovery.github-strategy-profile-scan`: use GitHub repo search/fetch to find reusable trading-system ideas, examples, and failure discussions.
- `discovery.x-reddit-strategy-inspiration-scan`: use public web search only, collect links and claims, classify API access as inactive until approved.
- `investigation.community-idea-to-kill-test-template`: turn social/profile ideas into a standard "claim -> mechanism -> data -> kill test" template.

## Verify/Reassess

This lane should broaden inspiration without broadening trust. GitHub can be active read-only now. X/Twitter and Reddit should be treated as watch/manual or web-search sources until access, terms, freshness, exportability, and cost are verified. The main value is not gathering more opinions; it is creating a disciplined funnel from public operator ideas into RALPH's falsification machinery.

Self-check: research-only; public/free docs and connector checks only; no API keys; no paid access; no scraping; no new cron/cadence; no live trading; no watcher wording, risk, sizing, TP/SL, execution, or orders changed.
