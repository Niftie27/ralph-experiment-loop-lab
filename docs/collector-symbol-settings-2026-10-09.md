# Collector Symbol Settings - 2026-10-09

BTCUSDT keeps the original collector behaviour: 0.1 tick display, 5 USD footprint level, 1 USD profile bin, 10 BTC big-trade threshold, 25 BTC cluster/wall threshold, 2 BTC imbalance minimum, heatmap +/-150 USD in 2 USD rows, fragility 50/100/200 USD.

ETHUSDT, SOLUSDT, and HYPEUSDT were calibrated from the complete local futures hour `2026-10-09T08Z`:

- `big`: aggTrade quantity p99.9.
- `cluster`: per-minute footprint-cell volume p99 using the selected symbol footprint level.
- `wall`: saved book level quantity p99.
- `heat_range`: +/-0.2% of the hour median trade price.
- `frag_steps`: 0.06%, 0.12%, and 0.25% of the hour median trade price.
- price levels and heat/fragility distances are rounded to symbol tick multiples.
- `imb_min`: 2% of the cluster threshold, rounded up, to avoid BTC-sized imbalance noise on smaller symbols.

Observed calibration sample:

| Symbol | Median price | Trades | Trade p99.9 | Footprint level | Cell p99 | Book p99 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ETHUSDT | 2501.000 | 26313 | 233.909 | 0.20 | 1342.127 | 150.075 |
| SOLUSDT | 110.300 | 9528 | 2945.390 | 0.010 | 6081.440 | 14232.940 |
| HYPEUSDT | 85.902 | 10538 | 631.020 | 0.005 | 1550.710 | 1177.210 |

These are research defaults, not trading permissions. They only affect read-only collector tapes, features, events, heatmap, and fragility output.

## 2026-10-09 Live File Caveat

ETHUSDT, SOLUSDT, and HYPEUSDT `live_*` feature files from 2026-10-09 are invalid before the collector restart at `2026-10-09T13:46:03Z`.

Use rebuilt non-live engine outputs and rebuilt tapes for historical research before that timestamp. Treat same-day `live_*` files for those symbols as reliable only from `2026-10-09T13:46:03Z` onward.
