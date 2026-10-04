# HftBacktest Minimal Replay Runtime Spike

Generated: 2026-08-22T10:43:59.686014+00:00
Status: research-only-no-live-execution.
Source run: `2026-08-22T08-39-ralph-hl-btc-2h`

## Verdict: VALIDATED

Question: Can hftbacktest ingest no-key capture-v2 hyperliquid BTC rows and run a trivial replay baseline?

Evidence: `hftbacktest` installed in an isolated scratch venv, converted hyperliquid BTC capture-v2 rows into `event_dtype`, validated corrected event order, seeded an initial depth snapshot, and ran no-trade plus passive fixed-spread smoke baselines.

## Runtime

- Python: 3.12.3
- hftbacktest: 2.4.4
- NumPy: 2.2.6

## Frozen Assumptions

- venue: `hyperliquid`
- symbol: `BTC`
- maker_fee: `0.0`
- taker_fee: `0.0`
- order_latency_entry_ns: `0`
- order_latency_response_ns: `0`
- tick_size: `0.01`
- lot_size: `1e-05`
- passive_order_qty_btc: `0.001`
- exchange_model: `no_partial_fill_exchange`
- queue_model: `risk_adverse_queue_model`
- asset_model: `linear_asset(contract_size=1.0)`

## Conversion

- Raw events total: 855975
- Selected hyperliquid BTC events: 57390
- Source counts after snapshot: `{'l2_book': 13304, 'trade': 42627}`
- Initial snapshot rows: 10
- Base event rows: 175667
- Replay rows after order correction: 176075
- Negative feed-latency rows: 0
- Minimum feed latency: 266000000 ns
- Events missing exchange timestamp: 0
- Events missing local receive timestamp: 0

## Baselines

- No-trade: `{'valid_book_observations': 20, 'state': {'position': 0.0, 'balance': 0.0, 'fee': 0.0, 'num_trades': 0, 'trading_volume': 0.0, 'trading_value': 0.0}, 'ending_book': {'timestamp_ns': 1787395177276000000, 'best_bid': 77122.0, 'best_ask': 77123.0, 'best_bid_qty': 4.46878, 'best_ask_qty': 0.83535}}`
- Passive fixed-spread single quote: `{'starting_book': {'timestamp_ns': 1787387978022000000, 'best_bid': 77168.0, 'best_ask': 77169.0, 'best_bid_qty': 20.71284, 'best_ask_qty': 0.00406}, 'submit_results': {'buy': 0, 'sell': 0}, 'state': {'position': 0.0, 'balance': 0.000999999999990564, 'fee': 0.0, 'num_trades': 2, 'trading_volume': 0.002, 'trading_value': 154.337}, 'open_orders': 0, 'ending_book': {'timestamp_ns': 1787395177286000000, 'best_bid': 77122.0, 'best_ask': 77123.0, 'best_bid_qty': 4.46878, 'best_ask_qty': 0.83535}}`

## Interpretation

- Runtime/package path is available through an isolated uv venv; no global install is needed.
- The capture needs an initial depth snapshot before replay rows, otherwise hftbacktest loads the array but best bid/ask remain NaN.
- Fixture guards now reject crossed, locked, non-positive, and non-finite top-of-book rows before baseline claims.
- Selected converted rows have separate local receive timestamps and native exchange timestamp evidence.
- This is only a runtime smoke test over public no-key data, not evidence of trading edge.
- Passive quote fills are sensitive to zero latency, zero fees, queue model, and short sample length.

## Next Steps

- Keep fixture tests in front of converter changes and add exchange-specific timestamp evidence checks before longer replay claims.
- Run a longer bounded no-key capture before evaluating any edge-like metric.
- Replace zero-fee/zero-latency assumptions with exchange-specific conservative assumptions before strategy work.

