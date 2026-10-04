# Wallet-Shadow / High-Volatility Event Case File

Status: research direction, not execution project.

Hypothesis: high-volatility events, protocol incidents, liquidity shocks, and wallet/entity behavior may expose short-lived patterns worth researching.

M0 needs:

- signal taxonomy
- data rails
- historical examples
- replay/benchmark plan
- false-positive analysis
- risk analysis

Important constraint:

- Do not assume Base mempool copy-trading works. The MEV handoff flags Coinbase sequencer ordering as a structural issue. Treat wallet-shadow as event/entity research first, not execution.

Current refined hypothesis:

- wallet-shadow alone is probably too fragile;
- wallet-shadow plus high-volatility event triggers may be more realistic because large moves create wider and more frequent dislocations;
- this still needs falsification before any framework or prototype choice.
