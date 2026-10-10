# Storage maintenance first-run result - 2026-10-10

Scope: read-only audit after the first `ralph-storage-maintenance.service` run and later queued timer runs. No new maintenance run was started for this audit.

## Service state

When checked after the usage-limit interruption, the earlier long first run had finished. A later hourly timer run was active at 12:04 UTC, so no second run was started manually; the audit waited for it to finish.

Relevant service start/finish lines:

```text
2026-10-10T06:44:57+00:00 Starting ralph-storage-maintenance.service
2026-10-10T08:18:51+00:00 Finished ralph-storage-maintenance.service
2026-10-10T08:18:51+00:00 Starting ralph-storage-maintenance.service
2026-10-10T08:21:27+00:00 Finished ralph-storage-maintenance.service
2026-10-10T09:04:17+00:00 Starting ralph-storage-maintenance.service
2026-10-10T09:04:17+00:00 Finished ralph-storage-maintenance.service
2026-10-10T10:04:17+00:00 Starting ralph-storage-maintenance.service
2026-10-10T10:06:04+00:00 Finished ralph-storage-maintenance.service
2026-10-10T11:04:17+00:00 Starting ralph-storage-maintenance.service
2026-10-10T11:06:00+00:00 Finished ralph-storage-maintenance.service
2026-10-10T12:04:17+00:00 Starting ralph-storage-maintenance.service
2026-10-10T12:07:15+00:00 Finished ralph-storage-maintenance.service
```

Final state after waiting:

```text
Result=success
ExecMainStartTimestamp=Sat 2026-10-10 12:06:54 UTC
ExecMainExitTimestamp=Sat 2026-10-10 12:07:15 UTC
ExecMainStatus=0
ActiveState=inactive
SubState=dead
```

## Verification counts

Counts from journal lines between `2026-10-10T06:40Z` and `2026-10-10T12:04Z`:

```text
BTCUSDT gzip_tape 35
BTCUSDT xz_raw 35
ETHUSDT gzip_tape 29
ETHUSDT xz_raw 29
SOLUSDT gzip_tape 29
SOLUSDT xz_raw 29
HYPEUSDT gzip_tape 28
HYPEUSDT xz_raw 28
ERROR_LINES 0
```

The later 12:04 timer run also completed successfully.

## Remaining uncompressed active files

After the 12:04 run completed, only the current unfinished hours remained as raw `.jsonl.gz` and tape `.csv`:

```text
BTCUSDT raw .gz: 2026-10-10T11Z, 2026-10-10T12Z
BTCUSDT tape .csv: 2026-10-10T11Z, 2026-10-10T12Z

ETHUSDT raw .gz: 2026-10-10T11Z, 2026-10-10T12Z
ETHUSDT tape .csv: 2026-10-10T11Z, 2026-10-10T12Z

SOLUSDT raw .gz: 2026-10-10T11Z, 2026-10-10T12Z
SOLUSDT tape .csv: 2026-10-10T11Z, 2026-10-10T12Z

HYPEUSDT raw .gz: 2026-10-10T11Z, 2026-10-10T12Z
HYPEUSDT tape .csv: 2026-10-10T11Z, 2026-10-10T12Z
```

## Disk

Before, at 2026-10-10T06:41Z during the disk alert test:

```text
disk_free_pct=43.23 path=/home/coder/data threshold=99.00
```

After the first-run backlog and queued timer runs:

```text
/home/coder/data free_pct 44.89 total 80307429376 used 40932040704 free 36052774912
/home/coder      free_pct 44.89 total 80307429376 used 40932040704 free 36052774912
```
