# Feature Study Report

Generated: 2026-08-29T21:56:27.530Z
Status: research-only-no-live-execution.

Research-only report. Buckets describe raw forward-return behavior after feature extremes; they are not trade recommendations and do not change live alerts, thresholds, risk, sizing, or execution.

## Sources

- BTC 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- BTC 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- ETH 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- ETH 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- SOL 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- SOL 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- XRP 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- XRP 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- DOGE 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- DOGE 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- AVAX 1h: 43775 candles, source=binance-public-archive-rest-tail, market=spot
- AVAX 4h: 10950 candles, source=binance-public-archive-rest-tail, market=spot
- HYPE 1h: 15173 candles, source=bybit-v5-linear-kline, market=linear_perpetual, features=[fundingRows=1897; openInterestRows=15172]
- HYPE 4h: 3794 candles, source=bybit-v5-linear-kline, market=linear_perpetual, features=[fundingRows=1897; openInterestRows=3793]

## Findings

### BTC 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=4921, threshold=30, 6-bar mean=-0.0531%, positiveRate=0.5247, signedMean=-0.0531%, signedDirection=long
- rsi_oversold_35: sample=7927, threshold=35, 6-bar mean=-0.0222%, positiveRate=0.535, signedMean=-0.0222%, signedDirection=long
- rsi_overbought_65: sample=8646, threshold=65, 6-bar mean=0.052%, positiveRate=0.4811, signedMean=-0.052%, signedDirection=short
- rsi_overbought_70: sample=5534, threshold=70, 6-bar mean=0.0588%, positiveRate=0.4817, signedMean=-0.0588%, signedDirection=short

### BTC 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1418, threshold=30, 6-bar mean=-0.1611%, positiveRate=0.5346, signedMean=-0.1611%, signedDirection=long
- rsi_oversold_35: sample=2166, threshold=35, 6-bar mean=-0.0271%, positiveRate=0.5406, signedMean=-0.0271%, signedDirection=long
- rsi_overbought_65: sample=2412, threshold=65, 6-bar mean=0.1206%, positiveRate=0.4855, signedMean=-0.1206%, signedDirection=short
- rsi_overbought_70: sample=1700, threshold=70, 6-bar mean=0.2171%, positiveRate=0.5029, signedMean=-0.2171%, signedDirection=short

### ETH 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=5222, threshold=30, 6-bar mean=-0.0973%, positiveRate=0.519, signedMean=-0.0973%, signedDirection=long
- rsi_oversold_35: sample=8359, threshold=35, 6-bar mean=-0.0528%, positiveRate=0.5279, signedMean=-0.0528%, signedDirection=long
- rsi_overbought_65: sample=8918, threshold=65, 6-bar mean=0.0576%, positiveRate=0.4816, signedMean=-0.0576%, signedDirection=short
- rsi_overbought_70: sample=5864, threshold=70, 6-bar mean=0.06%, positiveRate=0.4777, signedMean=-0.06%, signedDirection=short

### ETH 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1480, threshold=30, 6-bar mean=-0.2464%, positiveRate=0.5088, signedMean=-0.2464%, signedDirection=long
- rsi_oversold_35: sample=2211, threshold=35, 6-bar mean=-0.1087%, positiveRate=0.5341, signedMean=-0.1087%, signedDirection=long
- rsi_overbought_65: sample=2412, threshold=65, 6-bar mean=-0.0642%, positiveRate=0.4569, signedMean=0.0642%, signedDirection=short
- rsi_overbought_70: sample=1638, threshold=70, 6-bar mean=0.0453%, positiveRate=0.4658, signedMean=-0.0453%, signedDirection=short

### SOL 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=5190, threshold=30, 6-bar mean=0.0589%, positiveRate=0.5239, signedMean=0.0589%, signedDirection=long
- rsi_oversold_35: sample=8597, threshold=35, 6-bar mean=0.0276%, positiveRate=0.5219, signedMean=0.0276%, signedDirection=long
- rsi_overbought_65: sample=8534, threshold=65, 6-bar mean=0.0766%, positiveRate=0.4811, signedMean=-0.0766%, signedDirection=short
- rsi_overbought_70: sample=5350, threshold=70, 6-bar mean=0.0942%, positiveRate=0.4806, signedMean=-0.0942%, signedDirection=short

### SOL 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1451, threshold=30, 6-bar mean=-0.174%, positiveRate=0.4935, signedMean=-0.174%, signedDirection=long
- rsi_oversold_35: sample=2251, threshold=35, 6-bar mean=-0.1401%, positiveRate=0.4976, signedMean=-0.1401%, signedDirection=long
- rsi_overbought_65: sample=2222, threshold=65, 6-bar mean=0.2541%, positiveRate=0.495, signedMean=-0.2541%, signedDirection=short
- rsi_overbought_70: sample=1471, threshold=70, 6-bar mean=0.2451%, positiveRate=0.4854, signedMean=-0.2451%, signedDirection=short

### XRP 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=4872, threshold=30, 6-bar mean=-0.0157%, positiveRate=0.5255, signedMean=-0.0157%, signedDirection=long
- rsi_oversold_35: sample=8093, threshold=35, 6-bar mean=-0.0088%, positiveRate=0.5254, signedMean=-0.0088%, signedDirection=long
- rsi_overbought_65: sample=7753, threshold=65, 6-bar mean=0.095%, positiveRate=0.4588, signedMean=-0.095%, signedDirection=short
- rsi_overbought_70: sample=4742, threshold=70, 6-bar mean=0.0607%, positiveRate=0.4515, signedMean=-0.0607%, signedDirection=short

### XRP 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1340, threshold=30, 6-bar mean=0.1044%, positiveRate=0.5366, signedMean=0.1044%, signedDirection=long
- rsi_oversold_35: sample=2167, threshold=35, 6-bar mean=0.0253%, positiveRate=0.5228, signedMean=0.0253%, signedDirection=long
- rsi_overbought_65: sample=1912, threshold=65, 6-bar mean=0.2496%, positiveRate=0.431, signedMean=-0.2496%, signedDirection=short
- rsi_overbought_70: sample=1187, threshold=70, 6-bar mean=0.3363%, positiveRate=0.4297, signedMean=-0.3363%, signedDirection=short

### DOGE 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=5275, threshold=30, 6-bar mean=-0.0248%, positiveRate=0.5367, signedMean=-0.0248%, signedDirection=long
- rsi_oversold_35: sample=8577, threshold=35, 6-bar mean=-0.028%, positiveRate=0.5276, signedMean=-0.028%, signedDirection=long
- rsi_overbought_65: sample=7984, threshold=65, 6-bar mean=0.0649%, positiveRate=0.4652, signedMean=-0.0649%, signedDirection=short
- rsi_overbought_70: sample=4954, threshold=70, 6-bar mean=0.0395%, positiveRate=0.4623, signedMean=-0.0395%, signedDirection=short

### DOGE 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1460, threshold=30, 6-bar mean=0.2105%, positiveRate=0.539, signedMean=0.2105%, signedDirection=long
- rsi_oversold_35: sample=2313, threshold=35, 6-bar mean=0.0932%, positiveRate=0.5318, signedMean=0.0932%, signedDirection=long
- rsi_overbought_65: sample=1891, threshold=65, 6-bar mean=0.5274%, positiveRate=0.4479, signedMean=-0.5274%, signedDirection=short
- rsi_overbought_70: sample=1151, threshold=70, 6-bar mean=0.7019%, positiveRate=0.4509, signedMean=-0.7019%, signedDirection=short

### AVAX 1h

Rows: 43691; funding rows: 0; OI-change rows: 0; window: 2021-09-02T10:00:00.000Z to 2026-08-27T23:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=5688, threshold=30, 6-bar mean=-0.0178%, positiveRate=0.496, signedMean=-0.0178%, signedDirection=long
- rsi_oversold_35: sample=8942, threshold=35, 6-bar mean=-0.0631%, positiveRate=0.4936, signedMean=-0.0631%, signedDirection=long
- rsi_overbought_65: sample=8266, threshold=65, 6-bar mean=0.0244%, positiveRate=0.4757, signedMean=-0.0244%, signedDirection=short
- rsi_overbought_70: sample=5267, threshold=70, 6-bar mean=-0.0146%, positiveRate=0.4794, signedMean=0.0146%, signedDirection=short

### AVAX 4h

Rows: 10866; funding rows: 0; OI-change rows: 0; window: 2021-09-10T00:00:00.000Z to 2026-08-25T20:00:00.000Z.

Distributions:
- fundingRate: no rows
- openInterestChangePct: no rows

Extreme buckets:
- rsi_oversold_30: sample=1645, threshold=30, 6-bar mean=-0.2019%, positiveRate=0.49, signedMean=-0.2019%, signedDirection=long
- rsi_oversold_35: sample=2465, threshold=35, 6-bar mean=-0.2742%, positiveRate=0.4868, signedMean=-0.2742%, signedDirection=long
- rsi_overbought_65: sample=2153, threshold=65, 6-bar mean=0.0735%, positiveRate=0.4872, signedMean=-0.0735%, signedDirection=short
- rsi_overbought_70: sample=1384, threshold=70, 6-bar mean=0.0598%, positiveRate=0.4841, signedMean=-0.0598%, signedDirection=short

### HYPE 1h

Rows: 15089; funding rows: 15089; OI-change rows: 15089; window: 2024-12-08T00:00:00.000Z to 2026-08-28T16:00:00.000Z.

Distributions:
- fundingRate: sample=15089, p05=-0.0001, median=0.0001, p95=0.0004, mean=0.0001
- openInterestChangePct: sample=15089, p05=-1.0876, median=-0.0154, p95=1.2183, mean=0.0178

Extreme buckets:
- fundingRate_bottom_10: sample=2624, threshold=0, 6-bar mean=0.1271%, positiveRate=0.5034, signedMean=0.1271%, signedDirection=long
- fundingRate_bottom_5: sample=544, threshold=-0.0001, 6-bar mean=-0.0606%, positiveRate=0.489, signedMean=-0.0606%, signedDirection=long
- fundingRate_top_10: sample=1456, threshold=0.0002, 6-bar mean=-0.3078%, positiveRate=0.4306, signedMean=0.3078%, signedDirection=short
- fundingRate_top_5: sample=760, threshold=0.0004, 6-bar mean=-0.1739%, positiveRate=0.4421, signedMean=0.1739%, signedDirection=short
- openInterestChangePct_bottom_10: sample=1509, threshold=-0.711, 6-bar mean=0.1334%, positiveRate=0.5036, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_bottom_5: sample=755, threshold=-1.0876, 6-bar mean=0.1643%, positiveRate=0.5033, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_top_10: sample=1509, threshold=0.7663, 6-bar mean=0.0837%, positiveRate=0.493, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_top_5: sample=755, threshold=1.2183, 6-bar mean=0.1149%, positiveRate=0.4954, signedMean=n/a%, signedDirection=n/a
- rsi_oversold_30: sample=1472, threshold=30, 6-bar mean=0.1006%, positiveRate=0.5122, signedMean=0.1006%, signedDirection=long
- rsi_oversold_35: sample=2523, threshold=35, 6-bar mean=0.1661%, positiveRate=0.522, signedMean=0.1661%, signedDirection=long
- rsi_overbought_65: sample=2845, threshold=65, 6-bar mean=0.1873%, positiveRate=0.5097, signedMean=-0.1873%, signedDirection=short
- rsi_overbought_70: sample=1732, threshold=70, 6-bar mean=0.3356%, positiveRate=0.5289, signedMean=-0.3356%, signedDirection=short

### HYPE 4h

Rows: 3710; funding rows: 3710; OI-change rows: 3710; window: 2024-12-15T12:00:00.000Z to 2026-08-25T16:00:00.000Z.

Distributions:
- fundingRate: sample=3710, p05=-0.0001, median=0.0001, p95=0.0004, mean=0.0001
- openInterestChangePct: sample=3710, p05=-2.4538, median=-0.0453, p95=3.006, mean=0.0628

Extreme buckets:
- fundingRate_bottom_10: sample=656, threshold=0, 6-bar mean=0.5197%, positiveRate=0.5, signedMean=0.5197%, signedDirection=long
- fundingRate_bottom_5: sample=136, threshold=-0.0001, 6-bar mean=0.9477%, positiveRate=0.4853, signedMean=0.9477%, signedDirection=long
- fundingRate_top_10: sample=364, threshold=0.0002, 6-bar mean=-0.6713%, positiveRate=0.4148, signedMean=0.6713%, signedDirection=short
- fundingRate_top_5: sample=190, threshold=0.0004, 6-bar mean=-0.1168%, positiveRate=0.4526, signedMean=0.1168%, signedDirection=short
- openInterestChangePct_bottom_10: sample=371, threshold=-1.6313, 6-bar mean=0.1047%, positiveRate=0.4717, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_bottom_5: sample=186, threshold=-2.4538, 6-bar mean=0.3449%, positiveRate=0.4462, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_top_10: sample=371, threshold=1.8389, 6-bar mean=0.2354%, positiveRate=0.504, signedMean=n/a%, signedDirection=n/a
- openInterestChangePct_top_5: sample=186, threshold=3.006, 6-bar mean=1.1658%, positiveRate=0.5591, signedMean=n/a%, signedDirection=n/a
- rsi_oversold_30: sample=388, threshold=30, 6-bar mean=1.0364%, positiveRate=0.5515, signedMean=1.0364%, signedDirection=long
- rsi_oversold_35: sample=653, threshold=35, 6-bar mean=0.5343%, positiveRate=0.5161, signedMean=0.5343%, signedDirection=long
- rsi_overbought_65: sample=752, threshold=65, 6-bar mean=0.3045%, positiveRate=0.4628, signedMean=-0.3045%, signedDirection=short
- rsi_overbought_70: sample=468, threshold=70, 6-bar mean=0.4202%, positiveRate=0.4722, signedMean=-0.4202%, signedDirection=short

