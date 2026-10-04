---
type: note
name: Wallet Shadowing Prior Art Tool Scan
sources:
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - source-scan
related:
  - wiki/notes/2026-07-01-wallet-shadowing-next-direction.md
  - wiki/concepts/prior-art-before-experiment.md
  - wiki/concepts/wallet-shadowing-strategy-model.md
created: 2026-07-01T20:00:00Z
last_updated: 2026-07-01T20:00:00Z
---

# Wallet Shadowing Prior Art Tool Scan

This is the first manual A1 loop after ingesting the wallet-shadowing transcripts.

## Checked Sources

- Hyperliquid official info endpoint docs: confirms user/exchange data access and warns that time-range responses return max 500 items, requiring pagination by timestamp.
- Hyperliquid clearinghouse docs: confirms perps margin state, balance, and position concepts for each address.
- Copin official site/docs: confirms on-chain trader analytics and Hyperliquid copy-trading setup via API wallet; pricing docs list paid tiers.
- HyperX blog: confirms HyperX Score for Hyperliquid wallets across dimensions such as profitability, stability, win rate, risk control, efficiency, and experience.
- Nansen Hyperliquid API docs: confirms Hyperliquid leaderboard and smart-money perp trade surfaces.
- Chainstack Hyperliquid copy-trading guide: confirms practical engineering complexity around state management, event sequencing, and order sizing.
- Dexly/HyperTracker/BitMEX pages: confirm there are multiple existing copy-trading/tracker implementations, so RALPH should not assume the idea is unexplored.

## Finding

The prior art supports the transcript conclusion:

- discovery and tracking tools exist;
- copy-trading products exist;
- Hyperliquid public APIs are a plausible data rail;
- the missing RALPH-specific layer is not "can this be tracked?" but "does a selected cohort survive Tomas's latency, costs, and selection bias?"

## Implication

RALPH should not rush to build a full scanner from scratch.

The next loop should answer:

1. Can existing tools provide enough candidate discovery/export to avoid building a crawler?
2. Can Hyperliquid official APIs provide enough data for no-key forward paper-trading?
3. What minimum local system is still needed to measure capture ratio independently of vendor scores?

## Tool Roles

| Tool | Likely role | Current stance |
| --- | --- | --- |
| Hyperliquid API | Primary raw data rail | High priority |
| Copin | Prior art / candidate discovery / reference copy-trading UX | Evaluate, do not blindly trust |
| HyperX / HyperDash / Hypurrscan / ASXN | Hyperliquid-native analytics and wallet discovery | Evaluate |
| Nansen | Smart-money labels and leaderboard/API | Useful input, survivor-biased |
| Dune | SQL screening if Hyperliquid coverage is sufficient | Secondary |
| Arkham | Entity labels and Trump-person event wallet context | Radar/context, not truth |
| Tenderly | Later execution/simulation tooling | Not MVP discovery |
| EigenPhi | Later MEV strategy family | Not wallet-shadowing MVP |
| Messari | Narrative/fundamental research | Not wallet-shadowing MVP |

## Next Loop

Run `hyperliquid-data-feasibility-spike` before writing scanner code.
