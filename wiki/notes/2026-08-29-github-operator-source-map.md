---
type: note
topic: github-operator-source-map
created: 2026-08-29T22:52:06Z
last_updated: 2026-08-29T22:52:06Z
work_item: discovery.github-strategy-profile-scan
status: complete
scope: research-only
sources:
  - https://github.com/freqtrade/freqtrade
  - https://github.com/titouannwtt/freqtrade-ultimate
  - https://github.com/nkaz001/hftbacktest
  - https://github.com/djienne/COPY_WALLET_HYPERLIQUID
  - https://github.com/SimSimButDifferent/HyperLiquidAlgoBot
  - https://github.com/chainstacklabs/hyperliquid-trading-bot
  - https://github.com/Drakkar-Software/OctoBot
  - https://github.com/freqtrade/freqtrade/blob/develop/docs/exchanges.md
tags:
  - ralph
  - research-note
  - source-scan
related:
  - templates/community-idea-kill-test.md
  - ../../loops/x-github-research-loop.md
  - ../../wiki/notes/2026-08-27-operator-profile-community-autoresearch-lane.md
  - ../../wiki/notes/2026-08-29-community-idea-kill-test-template.md
---
# GitHub Operator Source Map

## Purpose

This closes `discovery.github-strategy-profile-scan` and also satisfies the small GitHub-backed portion of `discovery.operator-profile-source-map`.

The scan used public GitHub search/API/README access only. It did not clone repos, install dependencies, configure accounts, use keys, or run third-party trading code.

## Access Snapshot

| Source | Observed status | Access class | RALPH use |
| --- | --- | --- | --- |
| `freqtrade/freqtrade` | Public repo, active, large ecosystem. Docs mention Hyperliquid support and operational constraints. | verified-public | Framework and safety reference, not strategy authority. |
| `titouannwtt/freqtrade-ultimate` | Public Freqtrade fork, pushed 2026-08-28, focused on Hyperliquid, walk-forward, CPCV, custom hyperopt losses, and bundled Hyperliquid data. | verified-public / heavy-download-watch | Source of validation ideas and Hyperliquid data workaround claims; do not clone full data by default. |
| `nkaz001/hftbacktest` | Public repo for tick/order-book replay with queue position and latency realism. | verified-public | Strong reference for orderflow replay/fill realism. |
| `djienne/COPY_WALLET_HYPERLIQUID` | Public experimental Freqtrade strategy for copying a Hyperliquid wallet, dry-run recommended by its own README. | verified-public / execution-adjacent | Use as a copy-delay and hidden-risk falsification specimen, not as copy rules. |
| `SimSimButDifferent/HyperLiquidAlgoBot` | Public indicator/ML Hyperliquid bot; requires private key for normal bot setup. | verified-public / key-required-for-use | Use as a generic overfit/indicator-ML claim to kill-test, not as a candidate. |
| `chainstacklabs/hyperliquid-trading-bot` | Public grid bot, testnet/private-key oriented. | verified-public / key-required-for-use | Productized grid reference and safety comparison, not active execution. |
| `Drakkar-Software/OctoBot` | Public mature bot with backtesting, paper trading, grid/DCA/TradingView/social/AI connectors, and Hyperliquid among exchanges. | verified-public / account-key-for-use | Existing-tool fit reference; possible paper/UI benchmark later, no execution. |

## Source-Backed Ideas

### 1. Hyperliquid framework constraints are more valuable than strategy claims

Freqtrade docs state Hyperliquid support depends on bot-owned account assumptions, subaccounts/vaults, private-key signing, limited historical candles, and rate-limit/performance caveats for HIP-3 DEXes.

RALPH implication:

- keep Hyperliquid framework work as `Watch` unless Tomas approves account/key/testnet setup;
- prefer extracting constraints, lookahead checks, and data limitations over running the engine;
- treat manual trading on the same account as an explicit incompatibility risk for any future bot discussion.

Cheapest kill test:

Use local/public data to compare whether a proposed Hyperliquid strategy depends on unavailable historical candles or fill assumptions before any framework setup.

### 2. Freqtrade Ultimate is a useful validation-practice lead, but a heavy data/download risk

The fork claims Hyperliquid-specific improvements: bundled OHLCV, walk-forward/CPCV, custom hyperopt losses, liquidation detection, multi-bot caching, and 32+ enhancements. It also says the full repo/data footprint is large.

RALPH implication:

- classify as `Watch / validation-pattern-source`;
- mine docs/README for walk-forward and anti-overfit patterns before any clone;
- if later needed, sparse-checkout code-only first and avoid bundled data unless Tomas approves the storage/cost tradeoff.

Cheapest kill test:

Compare its public validation claims to RALPH's existing strategy-destruction gates: OOS, walk-forward folds, baseline lift, deflated-Sharpe proxy, drawdown, and rejection ledger reasons.

### 3. Copy-wallet repos prove the temptation and the risk

`COPY_WALLET_HYPERLIQUID` exposes exactly the wrong failure mode if copied blindly: target wallet selection, account-value scaling, leverage assumptions, long-only simplification, missed-trade recovery, and live position mirroring.

RALPH implication:

- use it as a negative template for `community-idea-kill-test.md`;
- require latency, hidden hedges, stale account, capacity, leverage, and exit-shadowing checks before any wallet idea becomes a candidate;
- keep all copytrading rows in `decisions/copytrading-watch-ledger.md` as Watch/proposed/needs-access/rejected unless a frozen forward paper spec exists.

Cheapest kill test:

Take one public no-key Hyperliquid wallet sample and measure copy delay, round-trip reconstruction, PnL concentration, and hidden-hedge ambiguity before any paper-copy spec.

### 4. Indicator/ML bot repos are baseline fodder, not evidence

Hyperliquid indicator/ML bot repos advertise Bollinger/RSI/ADX, ML optimization, backtesting, and risk-management features. This is a common overfit surface.

RALPH implication:

- convert each attractive indicator claim into a community idea kill-test record;
- compare to dumb baselines and current alert-edge buckets;
- require source reproducibility and OOS before creating a strategy candidate.

Cheapest kill test:

Run the indicator rule on existing no-key candles and reject unless it beats timestamp-matched hold and simple volatility/regime baselines after costs.

### 5. Grid/productized bots reinforce build-vs-buy discipline

Chainstack's Hyperliquid grid bot and OctoBot show that grid/DCA/TradingView/paper/live bot scaffolding is already productized.

RALPH implication:

- do not build execution scaffolding before proving a missing signal layer;
- use these as tool-fit and workflow references only;
- any account/key/testnet/live path remains approval-gated.

Cheapest kill test:

Before custom grid/range work, test whether RALPH has a signal that improves on a simple range baseline. If not, existing products are enough as references.

## Queue Impact

- `discovery.github-strategy-profile-scan`: done for this bounded pass.
- `discovery.operator-profile-source-map`: partially done for GitHub/code-backed sources; X/Reddit/manual operator profile mapping remains separate and stricter.
- Next useful branch: `discovery.public-orderflow-data-rail-spike` targeted to one missing replay-alignment gap, or `discovery.copytrading-public-route-ledger` if wallet/copytrading source work is preferred.

## Verify / Reassess

Verification:

- Public GitHub API returned current metadata for seven repos.
- Public raw READMEs were fetched for the Hyperliquid/Freqtrade/OctoBot leads.
- Freqtrade public docs were checked for Hyperliquid account, data, and rate-limit constraints.

Reassessment:

The strongest usable output is not a new strategy. It is a stricter source funnel: GitHub/code-backed ideas can feed kill-test records; live/copy/grid/ML claims should be treated as things to falsify before they can become candidates.

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
