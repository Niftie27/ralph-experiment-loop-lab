# Archive upload proof - 2026-10-11

Scope: small uploader fixes, shared SSH connection, archive upload systemd units, first full upload, and live latency proof while the upload was active.

Backlog note: `docs/backlog.md` line 13 remains open because this proves the upload latency test, not the 4-hourly research cron latency measurement.

## Code and tests

- Commit pushed before runtime sync: `1c685c35a6b9e153258035f06a42b663f953ade5`.
- Full collector suite: `Ran 37 tests in 1.078s` / `OK`.
- R3 staged scan, including the real Storage Box host and user strings: no staged matches.

Hashes:

```text
d89aaf6f7b47153070ee0050603d8144fb47e151ee0f3542e18b5e7af6e87931  tools/collector/archive_upload.py
d89aaf6f7b47153070ee0050603d8144fb47e151ee0f3542e18b5e7af6e87931  ~/ralph_collector/archive_upload.py
f4c77c6a73536ba437af7b14968923a71a0f8cfbf0deb940247b8db1b051208c  tools/collector/ralph-archive-upload.service
f4c77c6a73536ba437af7b14968923a71a0f8cfbf0deb940247b8db1b051208c  ~/ralph_collector/ralph-archive-upload.service
f4c77c6a73536ba437af7b14968923a71a0f8cfbf0deb940247b8db1b051208c  ~/.config/systemd/user/ralph-archive-upload.service
78757464ec8cf673d5e2ff953187672eed965a0212d482b3f7b2c06f5bf8d901  tools/collector/ralph-archive-upload.timer
78757464ec8cf673d5e2ff953187672eed965a0212d482b3f7b2c06f5bf8d901  ~/ralph_collector/ralph-archive-upload.timer
78757464ec8cf673d5e2ff953187672eed965a0212d482b3f7b2c06f5bf8d901  ~/.config/systemd/user/ralph-archive-upload.timer
```

## Shared SSH connection

- SSH config backup: `~/.ssh/config.bak-20261011T172345Z`.
- Added ControlMaster settings only to the `storagebox` host block.
- `ssh -o BatchMode=yes storagebox pwd`: returned `/home`.
- `ssh -O check storagebox`: `Master running`.

Timing for five `ssh storagebox pwd` calls:

```text
before: 0.37s, 0.34s, 0.35s, 0.36s, 0.39s
after:  0.02s, 0.02s, 0.02s, 0.02s, 0.02s
```

## First service upload

- UTC start noted before service start: `2026-10-11T17:26:04Z`.
- Journal finish: `2026-10-11T17:29:45Z`.
- Duration from noted start to journal finish: `3m41s`.
- `systemctl --user show`: `Result=success`, `ActiveState=inactive`, `ExecMainStatus=0`.
- Resource line: `Consumed 48.329s CPU time, 1017.0M memory peak, 0B memory swap peak`.

Journal summary lines:

```text
PENDING_MAINTENANCE count=0
INCOMPLETE_HOURS count=3 ETHUSDT/2026-10-11T15Z/missing=raw; HYPEUSDT/2026-10-11T15Z/missing=raw,tape; SOLUSDT/2026-10-11T15Z/missing=raw,tape
SUMMARY uploads=715 verified_existing=0 skipped_pass=9 new_rows=715
```

State rows after the run:

```text
PASS BTCUSDT book 67
PASS BTCUSDT raw 67
PASS BTCUSDT tape 67
PASS ETHUSDT book 59
PASS ETHUSDT raw 58
PASS ETHUSDT tape 59
PASS HYPEUSDT book 58
PASS HYPEUSDT raw 57
PASS HYPEUSDT tape 57
PASS SOLUSDT book 59
PASS SOLUSDT raw 58
PASS SOLUSDT tape 58
FAIL rows 0
```

Remote archive size:

```text
2.7G ralph
```

## Latency proof

Command:

```bash
/home/coder/venv-collector/bin/python /home/coder/ralph_collector/loadtest_live.py --collector /home/coder/ralph_collector/binance_live.py
```

Result during the service upload:

```text
Test: 10 s zateze 8926 obchodu/s, 9874 bid/ask/s a kniha 4465 urovni kazdych 100 ms (2x spicka)
Behem zateze skutecne doruceno: 6107 obchodu/s a 6759 bid/ask/s
Zivy dashboard pri zatezi: typicky 10 ms, 95 % do 18 ms, nejhur 28 ms
Nejhorsi zpozdeni: obchody 31 ms, kniha 21 ms, bid/ask 18 ms
VYSLEDEK: PROSEL, sberac stiha i dvojnasobek spicky.
```

Gate result:

- Dashboard worst: `28 ms` <= `100 ms`.
- Collector lag worst: `31 ms` <= `100 ms`.
- Service status: `0`.
- State FAIL rows: `0`.

## Timer

The timer was enabled only after the service status, FAIL-row, and latency gates passed.

```text
NEXT                        LEFT LAST PASSED UNIT                       ACTIVATES
Sun 2026-10-11 17:40:00 UTC 9min -         - ralph-archive-upload.timer ralph-archive-upload.service
```
