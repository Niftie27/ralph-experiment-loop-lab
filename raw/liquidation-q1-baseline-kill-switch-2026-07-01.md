# Liquidation Q1 + Baseline Kill Switch

Source: Telegram correction from Tomas plus claim-specific verification.
Date: 2026-07-01

## Context

Tomas accepted the liquidation-map prior-art correction, but identified a sequencing error:

> A broad product/gap map is too wide and too early. First ask whether liquidation cascades actually create a replay-positive bounce edge after costs, and whether that signal beats dumb baselines.

This source narrows the next liquidation-map loop.

## Correct Sequence

The first test should not be:

> Which liquidation heatmap product has the best UI/export/methodology?

The first test should be:

> Q1: After a large liquidation/cascade event, does passive liquidity around the move produce positive replay EV after fees, missed fills, adverse selection, and tail losses?

And immediately:

> Baseline gate: Does that liquidation-aware rule beat dumb rules such as "buy after a large red candle" or "buy after an X% drawdown"?

If the answer is no, the map is probably only a volatility/drawdown proxy. In that case, do not build a liquidation-map layer.

## Scope Reduction

Replace broad gap mapping with a narrower data question:

> What is the cheapest source of historical liquidation events plus market candles sufficient to run Q1?

Candidate sources:

- 0xArchive liquidation event data / replay / exports;
- Hyperliquid public or indexed fills/liquidations if available;
- CoinGlass heatmap API only if it can produce replayable event/level history cheaply;
- manual small sample only if no export is available.

Do not spend time comparing full heatmap-product methodology before Q1 passes.

## Baselines as Kill Switch

The baseline comparison is not a bullet point. It is a kill switch.

Minimum baselines:

1. Large red candle / large green candle reversal:
   - trigger after X% move over N minutes;
   - enter passive/next-bar at standardized levels;
   - same exit/stop/time rules.
2. Drawdown-from-recent-high / rally-from-recent-low:
   - trigger after X% distance from rolling high/low;
   - same costs and risk controls.

Optional baseline:

3. Volatility regime rule:
   - trigger when realized volatility exceeds percentile threshold;
   - same passive entry model.

If liquidation-aware clusters do not beat these after costs and tail losses, the liquidation map is not adding alpha.

## Pricing Verification Correction

Nansen pricing remains a live conflict:

- Nansen API docs currently say Free has 100 trial credits and "10x credit consumption"; Pro has $49/month annual or $69/month monthly and 1,000 starter credits.
- A newer Nansen Academy article says the Free 10x markup was removed, Free has 100 single-use credits plus a daily refresh to 10, and Pro has 2,000 credits/month.
- Nansen x402 is a separate mechanism with pay-per-call pricing ($0.01 basic, $0.05 premium).

Verdict:

> Do not lock a Nansen cost model until the live account/API page or current official docs are reconciled. Treat current public docs as inconsistent.

## Updated Next Loop

Before broad product gap mapping or replay harness:

> `liquidation-q1-baseline-kill-switch`

Output:

- cheapest historical liquidation-event source;
- event definition for cascade;
- replay rule definition;
- two dumb baselines;
- EV after fees and conservative fills;
- tail-loss and outlier sensitivity;
- verdict: discard, radar-only, proceed to broader gap map, or proceed to replay harness.

## Sources Checked

- Nansen API credits/pricing docs: https://docs.nansen.ai/getting-started/credits
- Nansen Academy API article: https://academy.nansen.ai/articles/0938495-get-started-with-api
- Nansen x402 post: https://nansen.ai/post/how-nansen-enabled-pay-per-call-onchain-data-access-with-x402-and-payai
- CoinGlass liquidation heatmap API: https://docs.coinglass.com/reference/liquidation-heatmap
- 0xArchive pricing: https://0xarchive.io/pricing
- Hyperliquid liquidations: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations
