---
type: research-note
date: 2026-08-21
tags:
  - ralph
  - agent-swarm
  - orchestration
  - launch-pattern
  - safety
related:
  - 2026-08-21-agent-swarm-research-layer.md
  - 2026-08-21-relative-pair-matrix.md
sources:
  - https://developers.openai.com/api/docs/guides/agents
  - https://openai.github.io/openai-agents-python/
  - https://openai.github.io/openai-agents-python/multi_agent/
  - https://github.com/openai/swarm
  - https://docs.langchain.com/oss/python/langchain/multi-agent
  - https://github.com/langchain-ai/langgraph-swarm-py
  - https://learn.microsoft.com/en-us/agent-framework/overview/
  - https://docs.crewai.com/
---

# Swarm Launch Pattern

Status: research note after Tomas challenged whether the RALPH swarm had a real launch/use model. Answer: the current RALPH code has a measurable offline research harness, not yet a true launched agent swarm.

## Findings

OpenAI's old `openai/swarm` repository is useful as a design reference for agents and handoffs, but it is explicitly educational/experimental rather than the right production base.

OpenAI's current Agents SDK is a better production reference: agents have instructions/tools/guardrails/handoffs, can be used as tools, and include sessions/tracing. The key design choice is whether orchestration is LLM-decided through handoffs or code-decided through an explicit controller.

LangGraph/LangGraph Swarm is a good reference for stateful graph orchestration and dynamic handoffs. CrewAI is a role/task/crew workflow framework. Microsoft's newer Agent Framework is the successor direction after AutoGen/Semantic Kernel and emphasizes state management, type safety, telemetry, and orchestration patterns.

For RALPH, the first implementation should not be a free-form chat swarm. The safer launch pattern is code-orchestrated fan-out/fan-in:

1. A controller selects jobs from a manifest.
2. Specialist agents receive narrow, read-only tasks.
3. Each agent writes a structured artifact.
4. A scorer evaluates artifacts against forward outcomes.
5. A critic blocks promotion unless sample size, cleanliness, and out-of-sample performance pass thresholds.
6. Execution remains outside the swarm until explicitly approved.

## Local OpenClaw Fit

This workspace can launch child agents through OpenClaw subagent/session tools. That is enough for bounded research jobs such as:

- BTC/ETH/SOL post-alert review;
- relative-pair context interpretation;
- orderflow/book-quality audit;
- feature proposal;
- hypothesis criticism;
- report synthesis.

The local RALPH harness already provides fan-in outputs:

- `agent-swarm-feature-table.json`
- `agent-scoreboard.json`
- `agent-scoreboard-slices.json`

The missing build piece is a launch manifest plus runner that creates child research jobs, requires structured JSON/Markdown artifacts, and then feeds or references those artifacts in the scorer.

## Practical RALPH Launch Contract

Every launched specialist job should include:

- `job_id`
- `agent_id`
- `scope`
- `inputs`
- `forbidden_actions`
- `output_schema`
- `deadline`
- `artifact_path`
- `status`

Forbidden by default:

- live orders;
- exchange/account/wallet access;
- credential reads;
- paid APIs;
- alert wording/threshold/risk/sizing changes;
- unsourced market claims.

## Verdict

Do not import a full framework yet. First build a local, explicit, file-backed RALPH swarm launcher using OpenClaw child sessions or local deterministic jobs. Move to Agents SDK/LangGraph only if local orchestration needs richer persistent state, tracing, handoffs, or a production deployment surface.

Next concrete build: `swarm-manifest.json` plus `src/swarm-launcher.mjs`, with dry-run and local-job modes first, then optional OpenClaw child-session launch mode.

## Implementation Added

The first launcher has now been built inside `ralph-research-os/experiments/btc-eth-alert-edge`:

- `swarm-manifest.json` declares the bounded research jobs, inputs, forbidden actions, required schemas, and artifact paths.
- `src/swarm-launcher.mjs` validates the manifest, prints a dry-run plan, runs deterministic local research jobs, and can prepare OpenClaw child-session prompt files without launching them.
- `npm run swarm:launch -- --mode local` writes `results/swarm-runs/<run-id>/artifacts/*.json`, `run-summary.json`, and `run-summary.md`.

Current launch modes are dry-run/local by default, with OpenClaw prompt preparation only. This is not a live swarm deployment and does not modify watcher services, alerts, thresholds, risk, sizing, accounts, wallets, keys, paid APIs, or execution.

The first verified local risk governor remains blocked: the refreshed scored set has `64` finalized rows, only `6` clean rows, dominant book-quality flags, weak/inverted scout performance, and no out-of-sample promotion test.
