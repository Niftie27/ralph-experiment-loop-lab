---
type: concept
name: Shadowability Latency Axis
sources:
  - raw/wallet-shadowing-latency-axis-correction-2026-07-01.md
  - raw/wallet-shadowing-claude-session-transcript.md
related:
  - wiki/concepts/forward-paper-trade-gate.md
  - wiki/concepts/wallet-shadowing-strategy-model.md
created: 2026-07-01T22:45:00Z
last_updated: 2026-07-01T22:45:00Z
---

# Shadowability Latency Axis

The key axis for wallet shadowing is not coin selection. It is whether the edge is slow enough to survive observation and execution delay.

## Rule

The faster the edge, the less shadowable it is.

## Why BTC Is A Bad Default

BTC directional moves usually discover price on centralized venues and derivatives markets before on-chain wallets can provide useful information. If RALPH observes a BTC position on-chain after the move starts, Tomas is likely late.

ETH is slightly more on-chain-native, but major ETH directional perps can still be CEX-led and crowded.

## What Is More Shadowable

Slower signals:

- structural funding/basis positioning;
- multi-day mid-cap accumulation;
- cohort flow rotation from stables to assets;
- repeated positioning styles where the holding period exceeds detection plus execution delay.

## Validation

Every candidate archetype needs a latency model. A signal is not promising unless it survives:

- detection delay;
- processing delay;
- execution delay;
- fees;
- slippage;
- position-size constraints.

