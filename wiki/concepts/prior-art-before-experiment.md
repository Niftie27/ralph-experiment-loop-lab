---
type: concept
name: Prior Art Before Experiment
sources:
  - raw/wallet-shadowing-claude-session-transcript.md
related:
  - wiki/concepts/wallet-shadowing-strategy-model.md
  - core/testing-protocol.md
created: 2026-07-01T19:45:00Z
last_updated: 2026-08-11T10:18:00Z
---

# Prior Art Before Experiment

Before RALPH proposes a 30-day test, simulation, or build, it should ask whether someone already tested the general question.

## Purpose

Avoid forcing Tomas to rediscover public results that already exist.

## Distinction

Prior art can often answer broad questions:

- does copy trading lose edge to fees/slippage?
- do copier returns differ from leader returns?
- do crowding and latency hurt copied fills?
- do vendor scores correlate with future performance?

Prior art usually cannot answer Tomas-specific live-edge questions:

- will this exact Hyperliquid cohort survive Tomas's latency?
- does this current market regime preserve capture ratio?
- which current wallets pass RALPH's forward gate now?

## RALPH Rule

Use prior art to shrink the experiment, not to skip the specific validation that must be measured in the current environment.

## Hard Gate Added 2026-08-11

Tomas explicitly reinforced the rule: do not reinvent the wheel.

Before RALPH builds, expands custom data capture, or creates a new backtest path, it must run a wheel scan:

- existing framework check
- existing dataset/API check
- existing public notebook/repo/paper/dashboard check
- cost/license/freshness check
- access check: can this workspace actually use it now, or does it need keys, account setup, paid subscription, connector/MCP, package install, export access, or explicit approval?
- reuse/adapt/custom exception decision

Custom work is allowed only when it answers a current Tomas-specific validation gap that available tools do not cover well enough.

If a tool/data source looks useful but access is not verified, it belongs in watch/proposed/needs-approval state. Do not build an active workflow around it until a usable path is proven or a public/no-key proxy is selected.
