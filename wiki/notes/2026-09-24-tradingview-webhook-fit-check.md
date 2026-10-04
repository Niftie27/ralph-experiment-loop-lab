---
type: note
created: 2026-09-24T05:52:00Z
topic: tradingview-webhook-fit-check
status: active
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../automation/current-operating-map.md
  - ../../../crypto-updates/realtime-market-watcher.mjs
  - ../../../crypto-updates/runtime/demo-sim-trades.jsonl
  - ./2026-08-25-profitability-loop-integration-map.md
---
# TradingView Webhook Fit Check

Status: source-backed fit check only. This does not authorize live orders, broker integration, exchange keys, TradingView account automation, paid plans, or browser automation.

## Verdict

TradingView webhooks are useful as an inbound alert source or routing bridge, not as the first implementation path for RALPH automatic demo trading.

The current better path is local `RALPH DEMO-SIM`: the Crypto Updates watcher owns live market ticks, full-TA gates, paper fills, simulated order lifecycle, and JSONL evidence without browser/account fragility.

## Officially Observed Capabilities

- TradingView Paper Trading is a built-in risk-free simulator / demo account for practicing orders with virtual funds across supported asset classes.
- TradingView alert webhooks send an HTTP POST to a user-provided URL when an alert triggers.
- If the alert message is valid JSON, TradingView sends it with an `application/json` content-type; otherwise it sends plain text.
- Webhooks require 2FA, only support ports 80 and 443, have a 3 second processing timeout, do not support IPv6, and can occasionally fail, with delivery visible in TradingView's alert log.
- Alert messages can include placeholders such as ticker, exchange, OHLCV, time, interval, and plot values.

## Practical Uses For RALPH

- Use TradingView as a chart-side alert source into OpenClaw/RALPH when a Pine script or visual chart condition is easier to express there than in the local watcher.
- Use webhook JSON payloads to enrich a local journal with TradingView symbol, timeframe, OHLCV, indicator/plot value, and chart condition.
- Use TradingView Paper Trading manually for visual practice and comparison, not as the canonical automated demo ledger.
- Use local DEMO-SIM for automated execution realism: submitted, filled, protective orders, slippage/fees, TP/SL/time exit, equity curve, and clean comparison to Bybit real executions.

## Non-Fit / Open Risks

- Official webhook docs describe TradingView -> external app delivery, not an API for an external watcher to place orders into TradingView Paper Trading.
- Browser automation into TradingView Paper Trading would be fragile and account/UI dependent; treat it as proposed only after a separate access and reliability check.
- TradingView webhook delivery has known operational constraints; RALPH should verify payload receipt and idempotency before trusting it as a signal source.

## Sources

- TradingView Paper Trading main functionality: https://www.tradingview.com/support/solutions/43000516466-paper-trading-main-functionality/
- TradingView webhook alert configuration: https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/
- TradingView alert placeholders: https://www.tradingview.com/support/solutions/43000531021-how-to-use-a-variable-value-in-alert/
- TradingView demo features: https://www.tradingview.com/support/solutions/43000754966-demo-features-on-tradingview/
