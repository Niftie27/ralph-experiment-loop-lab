# Storage Maintenance C - 2026-10-09

Date: 2026-10-09
Scope: read-only checks plus dry-run commands. No timers created/changed, no services restarted, no files deleted, no storage maintenance applied.

## Timer State

Command:

```bash
systemctl --user list-timers --all --no-pager
systemctl --user list-unit-files --type=timer --no-pager
```

Output:

```text
NEXT                            LEFT LAST                         PASSED UNIT                           ACTIVATES
Fri 2026-10-09 17:55:35 UTC 3h 19min Thu 2026-10-08 17:55:35 UTC 20h ago launchpadlib-cache-clean.timer launchpadlib-cache-clean.service

1 timers listed.
UNIT FILE                      STATE    PRESET
launchpadlib-cache-clean.timer enabled  enabled
systemd-tmpfiles-clean.timer   disabled enabled

2 unit files listed.
```

No RALPH collector/storage/disk-alert timer is installed or enabled.

## Disk Usage Now

Command:

```bash
df -h / /home /home/coder/data /home/coder/.openclaw/workspace
df -B1 /home/coder/data
du -h --max-depth=2 /home/coder/data | sort -h | tail -40
```

Output:

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        75G   38G   34G  53% /
/dev/sda1        75G   38G   34G  53% /
/dev/sda1        75G   38G   34G  53% /
/dev/sda1        75G   38G   34G  53% /
Filesystem       1B-blocks        Used   Available Use% Mounted on
/dev/sda1      80307429376 40500985856 36483829760  53% /
```

Largest `/home/coder/data` directories:

```text
1.6M	/home/coder/data/features
4.5M	/home/coder/data/features-solusdt/engine_rounded
5.6M	/home/coder/data/features-solusdt
18M	/home/coder/data/binance-solusdt/tape_rounded
19M	/home/coder/data/binance/tape_rounded
20M	/home/coder/data/binance-hypeusdt/tape_rounded
23M	/home/coder/data/features-ethusdt/engine_rounded
28M	/home/coder/data/features-ethusdt
39M	/home/coder/data/features-hypeusdt/engine_rounded
40M	/home/coder/data/features-hypeusdt
59M	/home/coder/data/binance-ethusdt/tape_rounded
178M	/home/coder/data/binance-hypeusdt
207M	/home/coder/data/binance-solusdt
501M	/home/coder/data/binance-ethusdt
873M	/home/coder/data/binance
1.8G	/home/coder/data
```

## Storage Maintenance Dry Run

Commands used `python3` because bare `python` is not installed on the VPS.

All four dry runs were run without `--apply` and without `--delete-raw`.

### BTCUSDT

Command:

```bash
python3 /home/coder/ralph_collector/storage_maintenance.py --symbol BTCUSDT --data /home/coder/data/binance --features /home/coder/data/features --retention-days 14
```

Dry-run result:

- raw xz actions: 17 hours, `2026-10-08T21Z` through `2026-10-09T13Z`
- tape gzip actions: 17 hours, `2026-10-08T21Z` through `2026-10-09T13Z`
- raw retention candidates: none

Output excerpt:

```text
ACTIONS
xz raw /home/coder/data/binance/raw_BTCUSDT_2026-10-08T21Z.jsonl.gz -> /home/coder/data/binance/raw_BTCUSDT_2026-10-08T21Z.jsonl.xz
...
xz raw /home/coder/data/binance/raw_BTCUSDT_2026-10-09T13Z.jsonl.gz -> /home/coder/data/binance/raw_BTCUSDT_2026-10-09T13Z.jsonl.xz
gzip tape /home/coder/data/binance/tape_BTCUSDT_2026-10-08T21Z.csv -> /home/coder/data/binance/tape_BTCUSDT_2026-10-08T21Z.csv.gz
...
gzip tape /home/coder/data/binance/tape_BTCUSDT_2026-10-09T13Z.csv -> /home/coder/data/binance/tape_BTCUSDT_2026-10-09T13Z.csv.gz
RAW_RETENTION_CANDIDATES
```

### ETHUSDT

Command:

```bash
python3 /home/coder/ralph_collector/storage_maintenance.py --symbol ETHUSDT --data /home/coder/data/binance-ethusdt --features /home/coder/data/features-ethusdt --retention-days 14
```

Dry-run result:

- raw xz actions: 9 hours, `2026-10-09T05Z` through `2026-10-09T13Z`
- tape gzip actions: 9 hours, `2026-10-09T05Z` through `2026-10-09T13Z`
- raw retention candidates: none

Output excerpt:

```text
ACTIONS
xz raw /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T05Z.jsonl.gz -> /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T05Z.jsonl.xz
...
xz raw /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T13Z.jsonl.gz -> /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T13Z.jsonl.xz
gzip tape /home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T05Z.csv -> /home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T05Z.csv.gz
...
gzip tape /home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T13Z.csv -> /home/coder/data/binance-ethusdt/tape_ETHUSDT_2026-10-09T13Z.csv.gz
RAW_RETENTION_CANDIDATES
```

### SOLUSDT

Command:

```bash
python3 /home/coder/ralph_collector/storage_maintenance.py --symbol SOLUSDT --data /home/coder/data/binance-solusdt --features /home/coder/data/features-solusdt --retention-days 14
```

Dry-run result:

- raw xz actions: 9 hours, `2026-10-09T05Z` through `2026-10-09T13Z`
- tape gzip actions: 9 hours, `2026-10-09T05Z` through `2026-10-09T13Z`
- raw retention candidates: none

Output excerpt:

```text
ACTIONS
xz raw /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T05Z.jsonl.gz -> /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T05Z.jsonl.xz
...
xz raw /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T13Z.jsonl.gz -> /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T13Z.jsonl.xz
gzip tape /home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T05Z.csv -> /home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T05Z.csv.gz
...
gzip tape /home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T13Z.csv -> /home/coder/data/binance-solusdt/tape_SOLUSDT_2026-10-09T13Z.csv.gz
RAW_RETENTION_CANDIDATES
```

### HYPEUSDT

Command:

```bash
python3 /home/coder/ralph_collector/storage_maintenance.py --symbol HYPEUSDT --data /home/coder/data/binance-hypeusdt --features /home/coder/data/features-hypeusdt --retention-days 14
```

Dry-run result:

- raw xz actions: 8 hours, `2026-10-09T06Z` through `2026-10-09T13Z`
- tape gzip actions: 8 hours, `2026-10-09T06Z` through `2026-10-09T13Z`
- raw retention candidates: none

Output excerpt:

```text
ACTIONS
xz raw /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T06Z.jsonl.gz -> /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T06Z.jsonl.xz
...
xz raw /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T13Z.jsonl.gz -> /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T13Z.jsonl.xz
gzip tape /home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T06Z.csv -> /home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T06Z.csv.gz
...
gzip tape /home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T13Z.csv -> /home/coder/data/binance-hypeusdt/tape_HYPEUSDT_2026-10-09T13Z.csv.gz
RAW_RETENTION_CANDIDATES
```

## Proposed Cleanup Only

Command:

```bash
find /home/coder/data -maxdepth 3 -type f | rg '/(_compressed_|_recompressed_)' || true
```

Output was empty: there are currently no `_compressed_` or `_recompressed_` original files under `/home/coder/data`.

Proposed cleanup, not executed:

- Only consider files whose names start with `_compressed_` or `_recompressed_`.
- Before any cleanup, verify that the corresponding `.csv.gz` or `.jsonl.xz` exists.
- Verify decompressed sha256 equality using the same `sha_lines()` logic in `storage_maintenance.py`.
- Move verified originals to a dated quarantine directory first, or delete only after explicit approval.
- Do not touch `tape_rounded/` or `engine_rounded/` in this cleanup; those are rollback/old-derived-data directories from the precision rebuild, not `_compressed_`/`_recompressed_` originals.

## Disk Alert Fire Test

Current free space was `45.43%`, so I used a deliberately higher threshold of `46.0%`.

Command:

```bash
python3 /home/coder/ralph_collector/disk_alert.py --path /home/coder/data --min-free-pct 46.0; echo exit_code=$?
```

Output:

```text
disk_free_pct=45.43 path=/home/coder/data
exit_code=2
```

Interpretation: the disk alert check fires as designed when the configured minimum free percentage is above current free space. This test only exercised the checker exit code; it did not install a timer or send Telegram.

