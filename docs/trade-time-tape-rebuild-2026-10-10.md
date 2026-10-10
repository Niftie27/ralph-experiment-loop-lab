# Trade-time tape rebuild - 2026-10-10

Scope: fix and prove the receive-time/raw-hour versus trade-time/tape-hour boundary bug. No service restart, no trading, no keys, no timer install, no retention deletion, and no disk deletion.

## Code

Pushed commit:

```text
439ce3775ac776a6e906644059061ee052d4da47 Fix trade-time tape verification
```

Runtime files synced from repo before live tape replacement:

```text
f153af0274f552834f047beaab42fd8aa5d4a7a9293b0fc2851bb0157ccdc278  tools/collector/verify_hour.py
f153af0274f552834f047beaab42fd8aa5d4a7a9293b0fc2851bb0157ccdc278  /home/coder/ralph_collector/verify_hour.py
268090b5b31490d9bc99aa7ecab01d10622e70326109b550943c66289dd6d338  tools/collector/rebuild_from_raw.py
268090b5b31490d9bc99aa7ecab01d10622e70326109b550943c66289dd6d338  /home/coder/ralph_collector/rebuild_from_raw.py
eb662528310824d82c157d204bb04864441525c40477690b7dfeca79b4cf76af  tools/collector/trade_time_tapes.py
eb662528310824d82c157d204bb04864441525c40477690b7dfeca79b4cf76af  /home/coder/ralph_collector/trade_time_tapes.py
```

## Tests and proof gates

Local tests:

```text
python3 -m py_compile tools/collector/trade_time_tapes.py tools/collector/verify_hour.py tools/collector/rebuild_from_raw.py tools/collector/orderflow_engine.py
python3 -m unittest tools/collector/test_trade_time_tapes.py tools/collector/test_binance_live.py tools/collector/test_symbol_settings.py
Ran 4 tests in 0.004s
OK
```

Fixed verifier on compressed BTC hours:

```text
PASS tape_BTCUSDT_2026-10-08T21Z.csv.gz ids=19493 minutes=51
PASS tape_BTCUSDT_2026-10-08T22Z.csv.gz ids=25195 minutes=60
```

Fixed verifier on five untouched live BTC hours:

```text
PASS tape_BTCUSDT_2026-10-08T23Z.csv ids=23533 minutes=60
PASS tape_BTCUSDT_2026-10-09T00Z.csv ids=31907 minutes=60
PASS tape_BTCUSDT_2026-10-09T01Z.csv ids=35137 minutes=60
PASS tape_BTCUSDT_2026-10-09T02Z.csv ids=45498 minutes=60
PASS tape_BTCUSDT_2026-10-09T03Z.csv ids=32966 minutes=60
```

Temp-dir rebuild proofs, run with `/home/coder/venv-collector/bin/python`:

```text
BTC08_BYTE_IDENTICAL True 80d49928321bd800ce2fa8f5ae90300daed2eed1c3d3b433acc5ef20c4f1ec79 80d49928321bd800ce2fa8f5ae90300daed2eed1c3d3b433acc5ef20c4f1ec79
ETH08_ARCHIVED_ID_SET_EQUAL True old 26311 new 26311 missing 0 extra 0 old_path /home/coder/data/binance-ethusdt/tape_rounded/tape_ETHUSDT_2026-10-09T08Z.csv
```

## Old-rule active tape set

These active tapes were rebuilt by the old raw-hour rule and were replaced with fixed trade-time rebuilds:

```text
BTCUSDT   2026-10-09T11Z 12Z 13Z
ETHUSDT   2026-10-09T05Z 06Z 07Z 08Z 09Z 10Z 11Z 12Z 13Z
SOLUSDT   2026-10-09T05Z 06Z 07Z 08Z 09Z 10Z 11Z 12Z 13Z
HYPEUSDT  2026-10-09T06Z 07Z 08Z 09Z 10Z 11Z 12Z 13Z
```

Replacement actions were recorded with UTC timestamps in `/home/coder/.openclaw/workspace/continuation-prompts/2026-10-10-0623-ralph-trade-time-rebuild-action-log.md`.

## Fixed tape-only rebuilds

```text
REBUILD_START 2026-10-10T06:24:15Z BTCUSDT 2026-10-09T11:00:00Z 2026-10-09T14:00:00Z
MOVED_TO_ROUNDED
/home/coder/data/binance/tape_BTCUSDT_2026-10-09T11Z.csv
/home/coder/data/binance/tape_BTCUSDT_2026-10-09T12Z.csv
/home/coder/data/binance/tape_BTCUSDT_2026-10-09T13Z.csv
TAPES_ONLY: skipped engine move/rebuild
REBUILD_DONE 2026-10-10T06:24:31Z BTCUSDT

REBUILD_START 2026-10-10T06:24:31Z ETHUSDT 2026-10-09T05:00:00Z 2026-10-09T14:00:00Z
MOVED_TO_ROUNDED
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T05Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T06Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T07Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T08Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T09Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T10Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T11Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T12Z.csv
/home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T13Z.csv
TAPES_ONLY: skipped engine move/rebuild
REBUILD_DONE 2026-10-10T06:24:58Z ETHUSDT

REBUILD_START 2026-10-10T06:24:58Z SOLUSDT 2026-10-09T05:00:00Z 2026-10-09T14:00:00Z
MOVED_TO_ROUNDED
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T05Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T06Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T07Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T08Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T09Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T10Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T11Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T12Z.csv
/home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T13Z.csv
TAPES_ONLY: skipped engine move/rebuild
REBUILD_DONE 2026-10-10T06:25:09Z SOLUSDT

REBUILD_START 2026-10-10T06:25:09Z HYPEUSDT 2026-10-09T06:00:00Z 2026-10-09T14:00:00Z
MOVED_TO_ROUNDED
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T06Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T07Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T08Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T09Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T10Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T11Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T12Z.csv
/home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T13Z.csv
TAPES_ONLY: skipped engine move/rebuild
REBUILD_DONE 2026-10-10T06:25:17Z HYPEUSDT
```

## Verification after rebuild

Every replaced tape passed the fixed verifier:

```text
PASS tape_BTCUSDT_2026-10-09T11Z.csv ids=87268 minutes=60
PASS tape_BTCUSDT_2026-10-09T12Z.csv ids=57059 minutes=60
PASS tape_BTCUSDT_2026-10-09T13Z.csv ids=86365 minutes=60
PASS tape_ETHUSDT_2026-10-09T05Z.csv ids=3938 minutes=12
PASS tape_ETHUSDT_2026-10-09T06Z.csv ids=23828 minutes=60
PASS tape_ETHUSDT_2026-10-09T07Z.csv ids=27938 minutes=60
PASS tape_ETHUSDT_2026-10-09T08Z.csv ids=26311 minutes=60
PASS tape_ETHUSDT_2026-10-09T09Z.csv ids=16878 minutes=60
PASS tape_ETHUSDT_2026-10-09T10Z.csv ids=30569 minutes=60
PASS tape_ETHUSDT_2026-10-09T11Z.csv ids=64962 minutes=60
PASS tape_ETHUSDT_2026-10-09T12Z.csv ids=44705 minutes=60
PASS tape_ETHUSDT_2026-10-09T13Z.csv ids=70164 minutes=60
PASS tape_SOLUSDT_2026-10-09T05Z.csv ids=1433 minutes=12
PASS tape_SOLUSDT_2026-10-09T06Z.csv ids=7475 minutes=60
PASS tape_SOLUSDT_2026-10-09T07Z.csv ids=8317 minutes=60
PASS tape_SOLUSDT_2026-10-09T08Z.csv ids=9528 minutes=60
PASS tape_SOLUSDT_2026-10-09T09Z.csv ids=8802 minutes=60
PASS tape_SOLUSDT_2026-10-09T10Z.csv ids=11139 minutes=60
PASS tape_SOLUSDT_2026-10-09T11Z.csv ids=17059 minutes=60
PASS tape_SOLUSDT_2026-10-09T12Z.csv ids=12102 minutes=60
PASS tape_SOLUSDT_2026-10-09T13Z.csv ids=14867 minutes=60
PASS tape_HYPEUSDT_2026-10-09T06Z.csv ids=4630 minutes=32
PASS tape_HYPEUSDT_2026-10-09T07Z.csv ids=11644 minutes=60
PASS tape_HYPEUSDT_2026-10-09T08Z.csv ids=10538 minutes=60
PASS tape_HYPEUSDT_2026-10-09T09Z.csv ids=8194 minutes=60
PASS tape_HYPEUSDT_2026-10-09T10Z.csv ids=11233 minutes=60
PASS tape_HYPEUSDT_2026-10-09T11Z.csv ids=17873 minutes=60
PASS tape_HYPEUSDT_2026-10-09T12Z.csv ids=16464 minutes=60
PASS tape_HYPEUSDT_2026-10-09T13Z.csv ids=25106 minutes=60
```

## Engine ordering check

`orderflow_engine.py` processes corrected tapes in trade-time order:

- `iter_trades()` sorts the active tape file paths.
- `iter_trades_file()` dedupes each tape by AggId and yields rows sorted by `(TradeTimeMs, AggId)`.
- The main replay loop merges trades, book, and raw misc streams with `heapq.merge(..., key=lambda x: (x[0], x[1]))`, so events are processed by timestamp, with trades using source priority `1`.

This depends on tape files being split by trade time, which the fixed rebuild now enforces.

## Full ETH/SOL/HYPE engine rebuilds

Commands used no `--since`:

```text
/home/coder/venv-collector/bin/python /home/coder/ralph_collector/rebuild_from_raw.py --symbol ETHUSDT --data /home/coder/data/binance-ethusdt --features /home/coder/data/features-ethusdt
/home/coder/venv-collector/bin/python /home/coder/ralph_collector/rebuild_from_raw.py --symbol SOLUSDT --data /home/coder/data/binance-solusdt --features /home/coder/data/features-solusdt
/home/coder/venv-collector/bin/python /home/coder/ralph_collector/rebuild_from_raw.py --symbol HYPEUSDT --data /home/coder/data/binance-hypeusdt --features /home/coder/data/features-hypeusdt
```

Engine results:

```text
ETHUSDT  Hotovo: 842 478 zprav od 2026-10-09T05:48:30Z do 2026-10-10T06:31:55Z
ETHUSDT  bars_60s.csv: 1483 bars, first 2026-10-09T05:48:00Z, last 2026-10-10T06:30:00Z

SOLUSDT  Hotovo: 435 181 zprav od 2026-10-09T05:48:30Z do 2026-10-10T06:32:48Z
SOLUSDT  bars_60s.csv: 1484 bars, first 2026-10-09T05:48:00Z, last 2026-10-10T06:31:00Z

HYPEUSDT Hotovo: 482 023 zprav od 2026-10-09T06:28:39Z do 2026-10-10T06:33:30Z
HYPEUSDT bars_60s.csv: 1445 bars, first 2026-10-09T06:28:00Z, last 2026-10-10T06:32:00Z
```

Full post-engine tape verification also passed for every completed tape rebuilt by those commands:

```text
ETHUSDT  2026-10-09T05Z through 2026-10-10T04Z: 24/24 PASS
SOLUSDT  2026-10-09T05Z through 2026-10-10T04Z: 24/24 PASS
HYPEUSDT 2026-10-09T06Z through 2026-10-10T04Z: 23/23 PASS
```
