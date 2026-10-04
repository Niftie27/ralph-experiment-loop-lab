---
type: source
title: Crypto Trading Bots Project Handoff
original_path: local://openclaw-media/PROJECT_HANDOFF.md
raw_file: raw/crypto-trading-bots-project-handoff.md
assets: []
authors: [Tomas, assistant]
published_date: 2026-06-30
relevance_score: 1.0
ingested: 2026-07-01T06:12:00Z
last_updated: 2026-07-01T06:12:00Z
entities: [wiki/entities/mev-bot-case-file.md, wiki/entities/zela.md]
concepts: [wiki/concepts/data-rail.md, wiki/concepts/benchmark-discipline.md, wiki/concepts/decision-layer.md]
---

# Crypto Trading Bots Project Handoff

Raw source: [[raw/crypto-trading-bots-project-handoff]]

## Why This Source Matters

This is the main historical source for the Crypto Trading Bots / MEV workspace. It records strategy ranking, built artifacts, open technical debt, eliminated paths, and the state of the Base L2 MEV bot.

## Key Claims

- Historical active focus was Polymarket scanner v0.2, monitoring-only.
- Base L2 MEV bot was MVP / monitoring-only and not end-to-end validated on target VPS.
- A 9-issue remediation audit existed, but the archive remains pre-patch in several important files.
- Execution was not wired end to end: `strategy-shadow` publishes `sim.req`, `anvil-pool` exposes HTTP `/simulate`, and nothing produces `exec.order`.
- Several earlier paths were killed or deprioritized: cross-DEX arb on Mantle due to slippage, Avalanche/Sonic, Arbitrum polling arb, and unvalidated Base wallet-shadow.
- Morpho liquidations were historically the strongest on-chain option, but competition density remained unknown.
- The owner discipline was "monitor first, execute later".

## RALPH Implications

- MEV bot material belongs as a case file and failure-mode source, not as an active execution workspace.
- RALPH should preserve the "monitor first, execute later" rule as a hard research discipline.
- The MEV handoff is useful for deriving validation checklists: slippage test first, verify real order-book depth, verify competition density, and prove execution wiring before any execution discussion.
- Polymarket should not be revived as the default path because Tomas later corrected that he does not trust it as primary.

## Open Questions From This Source

- Which pre-patch repo blockers should become RALPH validation rules?
- Does the wallet-shadow idea survive Base sequencer ordering and real detection delay?
- What would a read-only replay experiment need to prove before any bot framework is considered?

## Connections

- Source for [[wiki/entities/mev-bot-case-file]].
- Supports [[wiki/concepts/benchmark-discipline]] and [[wiki/concepts/decision-layer]].
