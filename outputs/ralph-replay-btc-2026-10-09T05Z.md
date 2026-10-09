# RALPH Orderflow Replay Check: BTC 2026-10-09T05Z

Generated: 2026-10-09T06:17:28.050Z
Status: pass

## Inputs

- tape: present (2696205 bytes) /home/coder/data/binance/tape_BTCUSDT_2026-10-09T05Z.csv
- raw: present (41939943 bytes) /home/coder/data/binance/raw_BTCUSDT_2026-10-09T05Z.jsonl.gz
- book: present (1882615 bytes) /home/coder/data/binance/book_BTCUSDT_2026-10-09T05Z.jsonl.gz

## Tape

- rows: 32422
- duplicates: 0
- sort violations: 0
- first key: [1791522000384,3480186781]
- last key: [1791525599978,3480219202]

## Replay

- ok: yes
- stdout: Hotovo: 39 914 zprav od 2026-10-09T05:00:00Z do 2026-10-09T05:59:59Z |   bars: 59 |   big_trade: 49 |   cluster: 34 |   liquidation: 43 |   stacked_imbalance: 17 |   velocity: 16 |   wall_added: 34 |   wall_filled: 4 |   wall_pulled: 29 | Vystupy jsou v /tmp/ralph_replay_btc_2026-10-09T05Z
- stderr: n/a

## Outputs

- all_prices_2026-10-09_partial.csv: 129384 bytes
- bars_60s.csv: 24179 bytes
- events.jsonl: 29351 bytes
- footprint_60s.jsonl.gz: 4424 bytes
- sessions.csv: 200 bytes

Boundary: read-only replay verification; no live trading, orders, keys, accounts, thresholds, alert wording, sizing, TP/SL, execution behavior, scheduler mutation, or public posting changed.

