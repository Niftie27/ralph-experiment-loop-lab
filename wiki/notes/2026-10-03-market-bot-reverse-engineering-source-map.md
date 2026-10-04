---
type: research-note
created: 2026-10-03T16:52:00Z
topic: market-bot-reverse-engineering-source-map
status: complete
work_item: discovery.market-bot-reverse-engineering-source-map
scope: research-only
tags:
  - ralph
  - research-only
  - source-scan
  - trading-bots
  - prior-art
  - no-live-trading
  - no-execution
sources:
  - https://www.freqtrade.io/en/stable/
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://hummingbot.org/docs/
  - https://github.com/jesse-ai/jesse
  - https://github.com/drakkar-software/octobot
  - https://help.3commas.io/en/collections/19714499-trading-bots
  - https://bitsgap.com/helpdesk/article/10026931762972-Introduction-to-Bitsgap-Trading-Bots
  - https://www.pionex.com/en/bot
  - https://support.cryptohopper.com/en/articles/9133482-what-is-the-strategy-designer-and-what-can-it-do
  - https://docs.cryptohopper.com/docs/marketplace/
  - https://help.coinrule.com/articles/239683-how-to-use-coinrule
  - https://docs.gmgn.ai/index/wallet-radar
  - https://docs.gmgn.ai/index/wallets-import-export
  - https://github.com/zer0cache/hyperliquid-market-maker-bot
related:
  - 2026-10-03-market-bot-reverse-engineering-backlog.md
  - 2026-08-30-existing-tool-fit-map.md
  - 2026-08-30-event-driven-bot-repo-search.md
  - 2026-08-30-build-vs-buy-decision-memo.md
---
# Market Bot Reverse-Engineering Source Map

## Purpose

First bounded pass for `discovery.market-bot-reverse-engineering-source-map`.

Question: what bots and bot-like products already exist on the market, what strategy claims do they expose publicly, and what can RALPH steal as falsifiable research ideas without running anything, connecting accounts, paying for access, copying proprietary code, or touching live/paper/demo alert behavior?

## Result

Verdict: `source_map_complete_no_candidate_no_automation`.

The market is not hiding one magical edge; it is mostly exposing repeatable strategy families and product patterns:

- grid/range harvesting;
- DCA / martingale-ish averaging;
- market making / spread capture;
- trend / breakout / indicator rules;
- signal marketplaces;
- copy/wallet following;
- AI-assisted operator shells;
- event-driven architecture and validation tooling.

RALPH's useful move is not to copy a bot. It is to extract each public claim into a kill test: mechanism, market regime, data needed, fees/slippage/funding, baseline, failure mode, and access/legal boundary.

## Source Map

| Source | Access class | Markets / venues | Observable family | Claimed edge | Evidence quality | Cheapest RALPH kill test | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Freqtrade | Open source / self-hosted; live-capable; dry-run/backtest tooling | Major spot/futures exchanges including Binance, Bybit, OKX, Gate, Kraken, Hyperliquid | Python strategy framework, TA rules, optimization, dry-run/live | Strategy iteration plus backtest/dry-run/live workflow | High for validation practices; not edge evidence | Borrow lookahead/recursive analysis discipline and compare any candidate against baseline/exported trades before paper wording | Watch as validation reference |
| Hummingbot | Open source framework plus dashboard/API/Condor surfaces; live-capable | CEX/DEX connectors and market-making workflows | Market making, scripts/controllers, multi-bot orchestration, AI-assisted operator layer | Modular automation across exchanges/blockchains | High for architecture and operator workflow; not edge evidence | Map RALPH's event/command/audit split against Hummingbot scripts/controllers; no install until a candidate needs it | Watch as architecture reference |
| Jesse | Open source / self-hosted; paper/live/backtest/research API; MCP surface | Spot/futures, DEX support claims | Python strategy framework, rule significance, Monte Carlo, optimization, ML | Faster strategy research and robustness tests | Good for validation ideas; not proven strategy edge | Reuse significance-test/Monte-Carlo framing for candidate preflight; do not adopt framework now | Watch as research reference |
| OctoBot | Open source bot with AI/Grid/DCA/TradingView positioning in public GitHub summary | Binance, Hyperliquid, 15+ exchanges claimed | AI, grid, DCA, TradingView automation | Easy automation across many venues | Source-level claim only in this pass | Extract grid/DCA/AI operator claims into separate kill-test templates if needed | Watch/source idea |
| 3Commas | Commercial SaaS; account/exchange API required for use | Connected exchanges | Signal bot, DCA bot, grid bot, TradingView-start conditions | User-configured automation and position management | Product docs show surfaces, not edge proof | Use as taxonomy for DCA/grid/signal bot failure modes: DCA depth, capital lockup, trend/chop mismatch, signal latency | Watch/prior art |
| Bitsgap | Commercial SaaS; exchange/API connection and subscription surface | Connected exchanges | GRID, BTD, DCA, Loop, COMBO, DCA Futures, AI Assistant | Sideways-grid harvesting, buy-the-dip accumulation, leveraged combo | Product docs give mechanism and market-condition claims | Test grid/DCA/combo ideas against simple range/hold/no-trade baselines with fees, funding, leverage, and tail moves | Source idea, no active rail |
| Pionex | Exchange with built-in bots and API docs; account required for use | Pionex spot/futures | Grid, DCA, rebalancing, futures bots | Built-in 24/7 buy-low/sell-high automation | Product docs/marketing only | Use as reminder that grid/DCA is commodity; require baseline lift before any RALPH branch | Watch/prior art |
| Cryptohopper | Commercial SaaS; marketplace/subscription/API-key connection | Connected exchanges | Strategy Designer, marketplace strategies/signals/templates, AI strategy designer, TradingView alerts | No-code TA automation and marketplace signal copying | Product docs; marketplace claims need per-seller validation | Extract public marketplace strategy metadata only if accessible; score by disclosed backtest, drawdown, average hold, update policy | Watch/needs-account for deeper rows |
| Coinrule | Commercial cloud rules platform; free/premium plan and demo exchange; exchange connection for real trading | Connected exchanges plus stocks/DeFi surfaces | Marketplace rules, templates, custom if-this-then-that strategies, TradingView integration | Cloud 24/7 rule automation | Product docs; no independent edge proof | Translate template-rule families into dumb baselines; useful for operator-language, not a source of edge | Watch/prior art |
| GMGN | Public docs for wallet radar and import/export; trading/copy surfaces likely account/action-gated | Memecoin/wallet tracking surfaces | Wallet radar, wallet tracking/import/export, copy-trade adjacency | Find active wallets and track/copy behavior | Useful for workflow shape; data/export/API coverage not verified as open programmatic rail | Keep copy/wallet source discovery separate from copyability; require independent event windows, full fills, exits, latency/cost stress | Watch/needs-access |
| Hyperliquid market-maker bot repos | Public GitHub repos; execution-adjacent; wallet/API/infra often needed for use | Hyperliquid perps/HIP-3 | Market making, grid, VWAP fair value, spread capture, BBO quoting | Earn spread / mean-revert around fair value | Good for architecture and risk-control specimens; not edge proof | Extract inventory, adverse selection, toxicity, funding, fee, and markout tests; do not run live-capable code | Watch/source claims only |

## Cross-Source Pattern

The common product claims cluster around easy automation, not verified edge. Most sources expose the same hidden risks:

- fees and funding can eat small per-trade edges;
- grid/DCA needs explicit trend-break and capital-exhaustion tests;
- market making needs adverse-selection, inventory, markout, and latency tests;
- signal/copy marketplaces need source-bias, survivorship, and delayed-entry checks;
- AI/operator shells increase accidental-execution risk unless read-only boundaries are hard;
- backtest-to-live parity claims need exported row-level trades, not screenshots.

## Candidate Kill-Test Templates

1. `grid_range_claim_falsifier`
   - Mechanism: harvest oscillations between upper/lower bounds.
   - Data needed: candle or tick path, fees, funding where futures, drawdown, missed breakout/slippage.
   - Baseline: no-trade, buy-and-hold, simple range fade without grid, and same capital allocation.
   - Kill: loses after fees/funding, requires trend hindsight, or max inventory/drawdown exceeds capital tolerance.

2. `dca_recovery_claim_falsifier`
   - Mechanism: average into drawdowns and exit on recovery.
   - Data needed: full adverse path, capital ladder, liquidation/leverage if futures, time-to-recovery.
   - Baseline: fixed-entry/stop, delayed entry, no-trade.
   - Kill: survives only by unbounded capital, hides liquidation risk, or underperforms after opportunity cost.

3. `market_making_spread_claim_falsifier`
   - Mechanism: quote both sides and collect spread.
   - Data needed: L2/trade replay, queue assumptions, markout, inventory, cancel/fill latency, maker/taker fees.
   - Baseline: passive mid/hold, simple BBO quote with inventory cap, no-trade.
   - Kill: toxic fills dominate, inventory drift explains returns, or fill assumptions require impossible queue priority.

4. `signal_marketplace_claim_falsifier`
   - Mechanism: buy/sell from third-party rules/signals/templates.
   - Data needed: timestamped signals, disclosed backtest, live history, pair universe, exits, drawdown, update policy.
   - Baseline: same-pair momentum/reversal dumb rule and random timestamp match.
   - Kill: no row-level history, drawdown hidden, performance depends on marketplace survivorship, or latency removes edge.

5. `wallet_copy_claim_falsifier`
   - Mechanism: infer and shadow profitable wallets.
   - Data needed: wallet selection timestamp, fills/exits, hidden hedges, latency, costs, venue/account constraints.
   - Baseline: independent event window, same-token beta, delayed-entry scenarios.
   - Kill: source wallet hedged elsewhere, exits unavailable, latency/cost wipes edge, or selection is leaderboard-survivorship.

## RALPH Decision

`discovery.market-bot-reverse-engineering-source-map` is complete for this first pass.

No source becomes a strategy candidate. The next useful branch, if Tomas wants to continue this lane, is one tiny kill-test record for a single public bot family, probably `grid_range_claim_falsifier` or `market_making_spread_claim_falsifier`, because those are common, source-rich, and easy to compare against dumb baselines before touching any live-capable tooling.

Do not create a recurring bot-market scan yet. First prove that one extracted claim produces useful reusable falsifier output.

## Boundary

No live trading, no orders, no keys, no paid APIs, no account setup, no wallet connection, no credentialed scraping, no access-control bypassing, no cron/scheduler change, no watcher behavior, no alert wording, no paper/demo alert logic, no risk, no sizing, no TP/SL, no execution, no public posting, and no strategy promotion changed.
