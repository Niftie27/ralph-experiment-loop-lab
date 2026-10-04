---
source_type: telegram_message
created: 2026-07-01T22:58:00Z
authors:
  - Tomas
  - assistant
---

# Tool-First Pivot

Tomas challenged the build-first framing around wallet shadowing and patient-retail strategies.

Key user questions:

- Why trade Litecoin or another less competitive asset?
- Are range/grid bots already built?
- Why build a bot if existing tools already do this?
- Why collect data if EigenPhi, Tenderly, Dune, Freqtrade, and other products already collect or expose data?
- Why not connect to something that works instead of inventing a new system?

Core correction:

> Default should not be "build from scratch." Default should be "verify existing tools first, use what exists, and only build the missing differentiated layer."

Initial verified findings:

- Freqtrade is an existing open-source trading bot engine with backtesting and dry-run support.
- Freqtrade official docs list Hyperliquid exchange-specific support, but Hyperliquid private calls require wallet/API-wallet signing. That means live use involves key handling and is not the first RALPH step.
- Freqtrade has a lookahead-analysis command for detecting lookahead bias.
- Grid/range bots are already productized by tools such as Pionex and 3Commas.
- Copin supports Hyperliquid copy-trading connection using a Hyperliquid API wallet, which again means key/permission handling and should not be enabled automatically.
- Dune has Hyperliquid market data, but official docs indicate monthly updates, making it useful for historical research, not necessarily real-time execution.
- Hyperliquid's own info endpoint supports fetching exchange/user info; time-range responses require pagination around a 500-element limit.

Practical implication:

Use existing tools as the default rails:

- Freqtrade for backtest/dry-run/paper/live engine where appropriate;
- Pionex/3Commas for off-the-shelf grid/range validation;
- Copin/HyperX for copy-trading prior art/reference;
- Dune/Nansen/Arkham for discovery and research data;
- Hyperliquid API for direct no-key public data and eventual paper-trade input;
- Tenderly/EigenPhi later only when the strategy family needs simulation or MEV flow.

The custom RALPH layer should shrink to:

- choosing the right branch;
- generating/validating the external signal;
- preventing bias;
- connecting the signal to a proven engine only after paper validation.

