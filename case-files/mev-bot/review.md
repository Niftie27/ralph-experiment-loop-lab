# MEV Bot Case File Review

Status: source-backed review, not execution work.

## Sources Read

- `wiki/sources/crypto-trading-bots-project-handoff.md`
- `wiki/sources/mev-bot-archive.md`
- extracted archive under `/tmp/ralph-mev-review/mev-bot`

## Findings

1. The archive is pre-patch. `ARCHIVE_NOTES.md` and the handoff both say the remediation tarball was not merged.
2. Monitoring mode is not cleanly separated from trading mode. Compose still hard-fails on `VAULT_SIGNER_KEY` even though monitoring should not need signing.
3. The data path is not end to end. `strategy-shadow` publishes `sim.req`, `sim-pool` exposes HTTP `/simulate`, and `bundler` consumes `exec.order`; there is no complete bridge.
4. Simulation is not decision-grade. `sim-pool` uses `eth_call`, then hardcodes gas to 21000 and PnL to 0.
5. The seed wallet CSV shape does not match the Rust struct in the archive.
6. Prometheus alert rules reference metric names that do not consistently match emitted metrics.
7. Base wallet-shadow is structurally suspect because Coinbase sequencer ordering weakens mempool copy-trading assumptions.
8. Base Flashblocks timing makes a 500 ms pending-block poll a questionable architecture if the system ever chased speed.

## Decision Implication

Do not resume this repo as an execution project. Use it to extract:

- failure modes
- validation checklist items
- architecture lessons
- monitoring-first discipline
- research questions about wallet-shadow and liquidation timing

## Next RALPH Action

Create an investigation brief: `mev-bot-failure-mode-extraction`.

