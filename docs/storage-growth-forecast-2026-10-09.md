# Storage growth forecast - 2026-10-09

## Scope

This is step 2 of the 2026-10-09 VPS storage work. It measures current collector
storage growth from file sizes and timestamps, then estimates days until
`/home/coder/data` free space drops below 20%.

No files were deleted, rewritten, compressed in place, or moved during this
measurement. The xz/gzip numbers below came from read-only stdout pipelines.

## Current disk threshold

Command:

```text
df -B1 /home/coder/data && df -h /home/coder/data
```

Output:

```text
Filesystem       1B-blocks        Used   Available Use% Mounted on
/dev/sda1      80307429376 41133907968 35850907648  54% /
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        75G   39G   34G  54% /
```

Computed threshold:

```text
filesystem_size_bytes=80307429376
available_bytes=35850907648
20pct_free_threshold_bytes=16061485875.2
headroom_until_20pct_free_bytes=19789421772.8
```

## Method

- Used completed hourly files only. The active `2026-10-09T18Z` hour was excluded.
- Excluded each symbol's first partial hour from rate calculations.
- For tape files, preferred the canonical `tape_SYMBOL_hour.csv` when both
  `tape_rounded/` and canonical rebuilt tape existed for the same hour.
- Treated `features*/engine_rounded/` as one-time rebuild output, not steady-state
  collector growth. Active feature dirs were counted separately.
- "No compression" below means no new storage-maintenance compression beyond the
  current collector shape, where raw/book are already gzip files and tape is CSV.
- Compression scenario uses measured per-symbol `xz -6` raw ratios and measured
  gzip tape ratios from the latest completed full hour (`2026-10-09T17Z`).

## Read-only compression samples

Command shape:

```text
gzip -cd raw_SYMBOL_2026-10-09T17Z.jsonl.gz | xz -6c | wc -c
gzip -c tape_SYMBOL_2026-10-09T17Z.csv | wc -c
```

Output:

```text
sample /home/coder/data/binance/raw_BTCUSDT_2026-10-09T17Z.jsonl.gz
raw_gz_bytes=44118319 xz_from_decompressed_bytes=20579228
sample /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T17Z.jsonl.gz
raw_gz_bytes=41407843 xz_from_decompressed_bytes=20286840
sample /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T17Z.jsonl.gz
raw_gz_bytes=16679653 xz_from_decompressed_bytes=8099164
sample /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T17Z.jsonl.gz
raw_gz_bytes=16420498 xz_from_decompressed_bytes=8356436
sample /home/coder/data/binance/tape_BTCUSDT_2026-10-09T17Z.csv
tape_csv_bytes=2899431 gzip_bytes=508794
sample /home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T17Z.csv
tape_csv_bytes=2521815 gzip_bytes=495346
sample /home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T17Z.csv
tape_csv_bytes=731684 gzip_bytes=169860
sample /home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T17Z.csv
tape_csv_bytes=1088860 gzip_bytes=237245
```

Measured ratios:

| Symbol | raw gzip -> xz ratio | tape CSV -> gzip ratio |
| --- | ---: | ---: |
| BTC | 0.4665 | 0.1755 |
| ETH | 0.4900 | 0.1964 |
| SOL | 0.4856 | 0.2322 |
| HYPE | 0.5089 | 0.2179 |

## Observed growth by symbol and type

Rates are shown as decimal GB/day and binary GiB/day. Decimal GB/day is the
primary unit for the user-facing headline.

| Symbol | Type | Hours | First hour | Last hour | Avg/hour bytes | GB/day | GiB/day |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: |
| BTC | raw | 20 | 2026-10-08T22Z | 2026-10-09T17Z | 47,814,421 | 1.148 | 1.069 |
| BTC | book | 20 | 2026-10-08T22Z | 2026-10-09T17Z | 1,988,595 | 0.048 | 0.044 |
| BTC | tape | 20 | 2026-10-08T22Z | 2026-10-09T17Z | 3,435,753 | 0.082 | 0.077 |
| BTC | features | active files | start 2026-10-08T21:09:19Z | sampled 2026-10-09T18:36:17Z | n/a | 0.002 | 0.002 |
| ETH | raw | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 47,032,090 | 1.129 | 1.051 |
| ETH | book | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 2,546,646 | 0.061 | 0.057 |
| ETH | tape | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 3,281,560 | 0.079 | 0.073 |
| ETH | features | active files | start 2026-10-09T05:48:34Z | sampled 2026-10-09T18:36:17Z | n/a | 0.012 | 0.011 |
| SOL | raw | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 19,687,042 | 0.473 | 0.440 |
| SOL | book | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 1,873,094 | 0.045 | 0.042 |
| SOL | tape | 12 | 2026-10-09T06Z | 2026-10-09T17Z | 923,218 | 0.022 | 0.021 |
| SOL | features | active files | start 2026-10-09T05:48:34Z | sampled 2026-10-09T18:36:17Z | n/a | 0.003 | 0.003 |
| HYPE | raw | 11 | 2026-10-09T07Z | 2026-10-09T17Z | 17,756,529 | 0.426 | 0.397 |
| HYPE | book | 11 | 2026-10-09T07Z | 2026-10-09T17Z | 2,096,461 | 0.050 | 0.047 |
| HYPE | tape | 11 | 2026-10-09T07Z | 2026-10-09T17Z | 1,281,633 | 0.031 | 0.029 |
| HYPE | features | active files | start 2026-10-09T06:28:49Z | sampled 2026-10-09T18:36:17Z | n/a | 0.004 | 0.004 |

Totals:

| Type | GB/day | GiB/day |
| --- | ---: | ---: |
| raw, current gzip | 3.175 | 2.957 |
| book, current gzip | 0.204 | 0.190 |
| tape, current CSV | 0.214 | 0.199 |
| active features | 0.022 | 0.020 |
| total no new compression | 3.615 | 3.366 |
| raw after xz estimate | 1.535 | 1.429 |
| tape after gzip estimate | 0.042 | 0.039 |
| total during raw-retention window after compression | 1.802 | 1.678 |
| steady growth after raw retention is saturated | 0.267 | 0.249 |

## Days until free space drops below 20%

The model uses the current headroom to 20% free:

```text
headroom_to_20pct_free_bytes=19789421772.8
```

Results:

| Scenario | Growth model | Days until <20% free |
| --- | --- | ---: |
| a. No new compression | current raw gzip + book gzip + tape CSV + features | 5.47 |
| b. Compression + 14-day raw retention | raw xz + tape gzip + book/features until day 14, then book/tape/features only | 10.98 |
| c. Compression + 7-day raw retention | raw xz + tape gzip + book/features until day 7, then book/tape/features only | 33.83 |

Interpretation:

- With current growth, disk pressure returns fast: about 5.5 days to the 20% free
  threshold.
- Compression roughly halves the first-window daily growth: from 3.615 GB/day to
  1.802 GB/day.
- A 14-day raw retention window is still long enough that the server crosses the
  20% free threshold before raw retention starts paying back space.
- A 7-day raw retention window crosses into the low steady-growth regime before
  the 20% threshold, extending the estimate to about 34 days.

## Caveats

- This is based on roughly half a day of ETH/SOL/HYPE and about 20 complete BTC
  hours. Market volatility can move these numbers materially.
- The current raw files are gzip files produced by the collector; "raw xz" means
  decompressing that raw stream and recompressing it with `xz -6`.
- Feature growth is small relative to raw, but the one-time `engine_rounded/`
  rebuild outputs are excluded from steady-state growth. If those outputs are
  kept and repeated often, they need a separate retention policy.
- This forecast does not enable or choose retention. Tomas still decides 7 vs
  14 days before raw deletion is enabled.
