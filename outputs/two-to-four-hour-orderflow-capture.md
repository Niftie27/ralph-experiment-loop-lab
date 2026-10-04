# Two-Hour Hyperliquid-First BTC Orderflow Capture

Generated: 2026-08-22T10:44:00Z
Item: validation.two-to-four-hour-orderflow-capture
Run ID: 2026-08-22T08-39-ralph-hl-btc-2h
Status: completed, research-only, no live execution

## Capture

- Process PID 1287957 was complete by the finalize check.
- Expected `manifest.json` was not present; the capture wrote `manifest.yaml`.
- Duration: 2026-08-22T08:39:38.114Z to 2026-08-22T10:39:38.176Z.
- Total raw records: 855,975.
- Source counts: Binance 798,585; Hyperliquid 57,390.
- Type counts: book_ticker 535,518; depth5 41,763; l2_book 13,304; mid 1,429; trade 263,961.

## Feature Extraction

- `orderflow-features.mjs` completed for the run.
- One-second feature rows: 11,519.
- Feature rows by source: Hyperliquid 7,209; Binance 4,310.
- Outputs:
  - `crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features.sqlite`
  - `crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-1s.csv`
  - `crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/features-manifest.yaml`

## Timestamp Quality

- Replay feasibility projected 1,885,667 hftbacktest-like rows.
- Separate local receive timestamps missing: 0.
- Hyperliquid projected rows had native exchange timestamp evidence:
  - Hyperliquid depth rows: 133,040 native / 0 fallback.
  - Hyperliquid trade rows: 42,657 native / 0 fallback.
- Binance trades had native exchange timestamps, but Binance book_ticker/depth rows still used fallback exchange timestamps. The Hyperliquid-only path remains the cleaner replay source for this validation.

## hftbacktest Smoke

- Runtime: isolated scratch uv venv with `hftbacktest==2.4.4`.
- Verdict: VALIDATED.
- Selected Hyperliquid BTC events: 57,390.
- Replay rows after order correction: 176,075.
- Missing exchange timestamp events: 0.
- Missing local receive timestamp events: 0.
- Negative feed-latency rows: 0.
- Minimum feed latency: 266,000,000 ns.
- No-trade baseline: 0 simulated trades.
- Passive fixed-spread single-quote baseline: 2 simulated trades under frozen zero-fee, zero-latency assumptions.

## Verification

- `node --check crypto-updates/orderflow-spike.mjs`: pass.
- `node --check crypto-updates/orderflow-features.mjs`: pass.
- `node --check ralph-research-os/automation/hftbacktest-orderflow-replay-feasibility.mjs`: pass.
- Python unittest fixture suite: pass, 7 tests.
- JSON parse checks: pass, 2 output JSON files.
- YAML parse checks: pass, 5 YAML files.

## Safety

No live watcher behavior, alert wording, alert thresholds, risk, sizing, execution, exchange accounts, exchange/wallet keys, paid APIs, or autonomous orders were changed. This result validates a public no-key capture and replay plumbing path only; it is not trading-edge evidence.
