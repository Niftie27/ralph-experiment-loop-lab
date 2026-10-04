# DEMO-SIM Funding Persistence Context Baseline

Generated: 2026-09-27T07:18:06.567Z
Verdict: `funding_context_improves_research_bucket`

This is a research-only context test. It joins public/no-key Hyperliquid funding history onto existing DEMO-SIM rows and asks whether funding sign/persistence improves the existing `range_breakout_long + BTC_RISK_ON` pocket versus BTC regime alone, no-trade, and the latest survivor stress result.

## Access and Cache

- Funding source: https://api.hyperliquid.xyz/info
- Cache status: fetched_public_no_key_and_cached
- Funding cache: data/funding/hyperliquid-funding-history-demo-sim.json
- Requested coins: ADA, AVAX, BNB, BTC, DOGE, ETH, LINK, SOL, XRP
- Funding rows cached: 4500
- Unavailable coins: none

## Baselines

| Key | Trades | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| noTrade | 0 | 0.00 | 0.00 | n/a | n/a | 0.0% |
| btcRegimeAlone | 107 | 9035.42 | 84.44 | 1.6348 | 50.5% | 24.5% |
| fundingAvailableSubset | 69 | 7747.56 | 112.28 | 1.8955 | 58.0% | 21.5% |
| survivorStressSelected | 107 | 9035.42 | n/a | 1.6348 | 50.5% | 24.5% |
| survivorStressTopPocket | 70 | 8394.46 | n/a | 1.859 | 57.1% | 28.0% |

## Funding Buckets Inside Selected Survivor

| Bucket | Trades | Net USD | Avg USD | PF | Winrate | Max DD | Avg lift | PF lift |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| persistent_positive | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% | 32.28 | 0.2149 |

## Sign Buckets Inside Selected Survivor

| Bucket | Trades | Net USD | Avg USD | PF | Winrate | Max DD | Avg lift | PF lift |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| positive | 67 | 7657.11 | 114.29 | 1.9077 | 58.2% | 21.6% | n/a | n/a |

## Top Pocket Funding Buckets

| Bucket | Trades | Net USD | Avg USD | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| persistent_positive | 40 | 4605.96 | 115.15 | 1.7584 | 26.7% |

## Interpretation

Best funding bucket is `persistent_positive` with 55 trades, 6420.03 USDT net, PF 1.8497, and 22.8% max drawdown. Versus BTC regime alone, its average PnL lift is 32.28 per trade, PF delta is 0.2149, and max-drawdown delta is -1.7%. This is a context-filter hint, not a strategy promotion: it narrows the research pocket but still inherits survivor-stress blockers and synthetic replay limits. Keep funding as research context only; do not turn it into carry, sizing, entry, alert, or execution logic without a separate cost/tail/accounting design and explicit approval.

## Boundary Delta

Changed: added one standalone research script, one standalone npm script, a local public funding cache, and JSON/Markdown outputs.

Unchanged: no scheduler or cron payloads, no live alerts, no watcher behavior, no keys/accounts/paid services, no sizing, no TP/SL, no execution behavior, no public posting, and no strategy promotion.

