# Retention dry run - 2026-10-10

Scope: dry-run only. No raw deletion was enabled or performed. Storage Box host/user are not configured yet, so every raw hour lacks archive verification.

Summary:
- BTCUSDT: candidates=0, reported_hours=44
- ETHUSDT: candidates=0, reported_hours=36
- SOLUSDT: candidates=0, reported_hours=36
- HYPEUSDT: candidates=0, reported_hours=35

Because the first raw hours are from 2026-10-08 and retention is 7 days, no raw file is older than the retention cutoff yet. Deletion remains blocked additionally by missing Storage Box archive verification.

## BTCUSDT

```text
2026-10-08T21Z /home/coder/data/binance/raw_BTCUSDT_2026-10-08T21Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-08T22Z /home/coder/data/binance/raw_BTCUSDT_2026-10-08T22Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-08T23Z /home/coder/data/binance/raw_BTCUSDT_2026-10-08T23Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T00Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T00Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T01Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T01Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T02Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T02Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T03Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T03Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T04Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T04Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T05Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T06Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T07Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T08Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T09Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T10Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T11Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T12Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T13Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T14Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T14Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T15Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T15Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T16Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T16Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T17Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T17Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T18Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T18Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T19Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T19Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T20Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T20Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T21Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T21Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T22Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T22Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T23Z /home/coder/data/binance/raw_BTCUSDT_2026-10-09T23Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T00Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T00Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T01Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T01Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T02Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T02Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T03Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T03Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T04Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T04Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T05Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T06Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T07Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T08Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T09Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T10Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T11Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T12Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T13Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T14Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T14Z.jsonl.xz not_older_than_retention_days;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T15Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T15Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T16Z /home/coder/data/binance/raw_BTCUSDT_2026-10-10T16Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;book_compression_invalid;missing_storagebox_archive_verification
```

## ETHUSDT

```text
2026-10-09T05Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T06Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T07Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T08Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T09Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T10Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T11Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T12Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T13Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T14Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T14Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T15Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T15Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T16Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T16Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T17Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T17Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T18Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T18Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T19Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T19Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T20Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T20Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T21Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T21Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T22Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T22Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T23Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-09T23Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T00Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T00Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T01Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T01Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T02Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T02Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T03Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T03Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T04Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T04Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T05Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T06Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T07Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T08Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T09Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T10Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T11Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T12Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T13Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T14Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T14Z.jsonl.xz not_older_than_retention_days;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T15Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T15Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T16Z /home/coder/data/binance-ethusdt/raw_ETHUSDT_2026-10-10T16Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;book_compression_invalid;missing_storagebox_archive_verification
```

## SOLUSDT

```text
2026-10-09T05Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T06Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T07Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T08Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T09Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T10Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T11Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T12Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T13Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T14Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T14Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T15Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T15Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T16Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T16Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T17Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T17Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T18Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T18Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T19Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T19Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T20Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T20Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T21Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T21Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T22Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T22Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T23Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-09T23Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T00Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T00Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T01Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T01Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T02Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T02Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T03Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T03Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T04Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T04Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T05Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T06Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T07Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T08Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T09Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T10Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T11Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T12Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T13Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T14Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T14Z.jsonl.xz not_older_than_retention_days;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T15Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T15Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T16Z /home/coder/data/binance-solusdt/raw_SOLUSDT_2026-10-10T16Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;book_compression_invalid;missing_storagebox_archive_verification
```

## HYPEUSDT

```text
2026-10-09T06Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T07Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T08Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T09Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T10Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T11Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T12Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T13Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T14Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T14Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T15Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T15Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T16Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T16Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T17Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T17Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T18Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T18Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T19Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T19Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T20Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T20Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T21Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T21Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T22Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T22Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-09T23Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-09T23Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T00Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T00Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T01Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T01Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T02Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T02Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T03Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T03Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T04Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T04Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T05Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T05Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T06Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T06Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T07Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T07Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T08Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T08Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T09Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T09Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T10Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T10Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T11Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T11Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T12Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T12Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T13Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T13Z.jsonl.xz not_older_than_retention_days;missing_storagebox_archive_verification
2026-10-10T14Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T14Z.jsonl.xz not_older_than_retention_days;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T15Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T15Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;missing_storagebox_archive_verification
2026-10-10T16Z /home/coder/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-10T16Z.jsonl.gz not_older_than_retention_days;missing_data_check_h;missing_data_check_h_plus_1;book_compression_invalid;missing_storagebox_archive_verification
```
