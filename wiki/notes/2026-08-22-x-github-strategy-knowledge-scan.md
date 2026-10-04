---
type: note
name: X/GitHub Strategy Knowledge Scan
sources:
  - https://github.com/freqtrade/freqtrade
  - https://github.com/freqtrade/freqtrade-strategies
  - https://github.com/iterativv/NostalgiaForInfinity
  - https://github.com/nkaz001/hftbacktest
  - https://github.com/rickquant/quantito
  - https://github.com/enarjord/passivbot
  - https://github.com/nautechsystems/nautilus_trader
  - https://github.com/polakowo/vectorbt
  - https://github.com/jesse-ai/jesse
  - https://github.com/barter-rs/barter-rs
tags:
  - ralph
  - research-note
  - source-scan
  - strategy-family
related:
  - loops/x-github-research-loop.md
  - decisions/candidates.md
  - wiki/concepts/strategy-destruction-filter.md
  - wiki/notes/2026-08-22-pre-ml-feature-label-table-spec.md
created: '2026-08-22T06:37:31Z'
last_updated: '2026-08-22T06:37:31Z'
---

# X/GitHub Strategy Knowledge Scan

## Verdict

The C-015 scan should change RALPH's route, not add trade ideas directly.

Public GitHub evidence points to three useful lanes:

1. use mature frameworks for operation and validation patterns;
2. mine failure/postmortem repos for anti-overfit rules;
3. test orderflow strategy ideas only in simulators that account for latency, queue position, fees, and partial-fill realism.

Do not vendor or run third-party strategies as signals. Treat them as examples to destroy, benchmark, or convert into validation tests.

## Access Check

- GitHub web search and unauthenticated GitHub API reads worked.
- No exchange, wallet, paid API, or account access was used.
- No private X/Twitter access is available in this workspace. Browser-searchable public discussion can be used later, but this loop's durable sources are GitHub repos/docs because they are inspectable and citeable.
- GitHub API metadata is rate-limited without auth, so broad recurring scans should stay bounded or use cached source notes.

## Source Triage

| Source | Current signal | RALPH use |
| --- | --- | --- |
| `freqtrade/freqtrade` | Mature crypto bot with dry-run, backtesting, plotting, hyperopt, lookahead and recursive analysis, plus broad exchange support including Bybit and Hyperliquid. | Best no-key framework spike for C-009/C-027, but keep live/exchange modes disabled. |
| `freqtrade/freqtrade-strategies` | Large strategy corpus for Freqtrade. | Use as negative/benchmark corpus: parse common patterns, then test whether they survive RALPH gates. |
| `iterativv/NostalgiaForInfinity` | Well-known Freqtrade strategy repo with strict config assumptions and many operator recommendations. | Treat as an operator-pattern case study, not a strategy to copy. |
| `nkaz001/hftbacktest` | Tick/order-book backtesting with feed/order latency and queue-position modeling; examples include Binance and Bybit. | Strongest C-036 validation lead for orderflow replay realism. |
| `rickquant/quantito` | Hyperliquid bot postmortem: high backtest Sharpe, weak live/testnet result, archived as overfit lesson. | Turn into anti-overfit checklist for strategy-destruction-filter and paper/live gap rules. |
| `enarjord/passivbot` | Active Bybit/Hyperliquid perps bot; grid/contrarian market making with optimizer and shared backtest/live order planning. | Architecture and risk-control reference only; execution path is key/account dependent and not active. |
| `nautechsystems/nautilus_trader` | Production-grade event-driven Rust/Python engine. | Study architecture sequencing later; too heavy for immediate C-036/C-009 spike. |
| `polakowo/vectorbt` | Fast vectorized research/backtesting library for many parameter sweeps. | Useful for brute-force idea destruction, but execution realism must be handled separately. |
| `jesse-ai/jesse` | Crypto strategy research/backtest/optimize/live framework. | Secondary comparison to Freqtrade after no-key setup is clearer. |
| `barter-rs/barter-rs` | Rust event-driven live/backtest framework. | Architecture reference; defer unless RALPH commits to Rust event engine work. |

## Concrete Lessons

### 1. Framework maturity is useful for tests, not authority

Freqtrade is the best immediate C-009 route because it has explicit backtesting and dry-run modes plus lookahead/recursive analysis commands. That maps directly to RALPH's current need: catch strategy-shape errors before any paper/live surface.

The danger is that Freqtrade strategy repositories can look like ready-made alpha. They should instead become a corpus for:

- feature vocabulary;
- common parameter ranges;
- known bad patterns;
- baseline strategy families to defeat.

### 2. Orderflow needs execution realism earlier than candle ideas

HftBacktest is the strongest C-036 follow-up because it is built around order book and trade tick replay, feed/order latency, queue position, and fill simulation. This is closer to the failure mode of public orderflow signals than ordinary candle backtests.

Immediate implication: before turning public depth/trade features into a promoted alert edge, RALPH should run a small feasibility spike:

- can local Binance/Bybit public depth/trade captures be converted into hftbacktest-compatible data;
- can a trivial order-book imbalance or spread/mean-reversion rule be replayed with fees and latency;
- does it beat a price-only/fixed-spread baseline after costs.

### 3. Overfit postmortems are high-value sources

Quantito is low-star but high-signal because it explicitly preserved failure: an attractive Hyperliquid backtest did not survive live/testnet conditions. Its lesson matches Tomas's strategy-destruction direction: unusually pretty backtests should raise suspicion, not confidence.

RALPH should mine postmortem repos and issues for failure tags:

- live/testnet win-rate collapse;
- Sharpe too high for the strategy class;
- slippage/latency/partial-fill omission;
- repeated parameter tweaking on the same history;
- funding/OI/CVD features added without independent validation.

### 4. Grid/perps bots confirm productized branches

Passivbot confirms that contrarian/grid perps operation is already productized and sophisticated. RALPH should not build a grid bot before proving a missing signal or validation layer. If range/grid remains interesting, use existing-tool evaluation or paper/demo planning, not custom execution code.

## Candidate Impact

- C-015 remains useful as a recurring discovery loop, but this bounded item is done.
- C-009 should stay benchmark-qualified: next concrete work is `trading-bot-framework-github-map` or `freqtrade-no-key-dry-run-spike`.
- C-036 should stay benchmark-qualified: next concrete work is `hftbacktest-orderflow-replay-feasibility`.
- C-027 stays watch/contained: Freqtrade is promising, but the wording must stay no-key/dry-run/backtest only.
- C-004 is unaffected; broad context data still needs a falsifiable benchmark target.

## Next Move

Highest-value next loop is C-036 via `hftbacktest-orderflow-replay-feasibility`: prove or kill whether RALPH's existing public depth/trade captures can be replayed under realistic orderflow assumptions.

Fallback if data conversion is too expensive: run C-009 `freqtrade-no-key-dry-run-spike` and use Freqtrade's lookahead/recursive analysis as a validation pattern for current strategy candidates.
