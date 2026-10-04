---
type: comparison
name: Existing Tools vs Custom RALPH Layer
sources:
  - raw/tool-first-pivot-2026-07-01.md
related:
  - wiki/concepts/tool-first-not-build-first.md
  - wiki/concepts/patient-retail-strategy-map.md
created: 2026-07-01T22:58:00Z
last_updated: 2026-07-01T22:58:00Z
---

# Existing Tools vs Custom RALPH Layer

| Job | Existing tool first | Custom RALPH role |
| --- | --- | --- |
| Backtest / dry-run / live engine | Freqtrade | only write strategy adapter after signal exists |
| Grid / range bot | Pionex, 3Commas, Freqtrade | evaluate whether range thesis beats baseline |
| Copy-trading execution | Copin, HyperX / similar | use as prior art; no keys without approval |
| Hyperliquid public data | Hyperliquid API, Dune, dashboards | validate exact data coverage and pagination |
| On-chain labels / discovery | Nansen, Arkham, Dune, Copin-style tools | avoid label worship; define activity/cohort rules |
| MEV / flow analytics | EigenPhi | only relevant if RALPH enters MEV strategy family |
| Transaction simulation | Tenderly | later execution/simulation layer, not alpha discovery |
| Patient-retail signal | not clearly productized | likely RALPH's differentiated layer |

## Conclusion

RALPH should become an evaluator and integrator before it becomes a builder.

The most likely custom layer is not a trading bot. It is:

- branch selection;
- signal definition;
- bias-safe validation;
- source memory;
- a small adapter from signal to a mature execution/paper engine.

