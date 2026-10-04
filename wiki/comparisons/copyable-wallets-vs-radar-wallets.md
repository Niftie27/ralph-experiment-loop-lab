---
type: comparison
name: Copyable Wallets vs Radar Wallets
sources:
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
  - raw/slow-copy-trading-distinction-2026-07-01.md
related:
  - wiki/concepts/wallet-shadowing-strategy-model.md
  - wiki/concepts/trump-risk-radar.md
created: 2026-07-01T19:45:00Z
last_updated: 2026-07-01T23:05:00Z
---

# Copyable Wallets vs Radar Wallets

## Comparison

| Dimension | Copyable wallet | Radar wallet |
| --- | --- | --- |
| Primary purpose | Candidate for paper-trade validation | Alert/context/risk signal |
| Selection basis | Repeatable behavior across many trades | Suspicious timing, entity attribution, treasury movement, event relevance |
| Validation | Forward paper-trade with latency/costs | Source verification and alert usefulness |
| Main failure | Historical PnL was luck, beta, or survivor bias | Misattribution or overreaction to noisy movement |
| Trump-person event role | Usually no | Yes |
| Live action | Never before validation | Notify or enrich context only |

## RALPH Decision

Trump-person event wallets belong primarily in the radar wallet bucket.

The copyable wallet bucket should come from a broader Hyperliquid-first activity universe and must pass the forward paper-trade gate.

## Copy-Trading Split

Do not treat copy-trading as one thing.

- Fast perp copy-trading belongs near radar/prior-art unless proven otherwise, because it reintroduces latency, worse fills, and leaderboard survivorship.
- Slow mid-cap accumulator following belongs in the copyable candidate bucket if it is cohort-based and passes round-trip forward testing.
