# Disk alert test - 2026-10-10

Scope: implement throttled OpenClaw Telegram alerting for low disk free space. No service restart, no timer install, no retention deletion, and no disk deletion.

## Runtime sync

```text
ba7d36c5fc394d780c569be333629dc5e90a4290bd50e0ad362c3f1d6320a60d  tools/collector/disk_alert.py
ba7d36c5fc394d780c569be333629dc5e90a4290bd50e0ad362c3f1d6320a60d  /home/coder/ralph_collector/disk_alert.py
baae480ddfe6f25e6c396087633e2a12f347db1c5c13f78276eaff47d141c5da  tools/collector/ralph-disk-alert.service
baae480ddfe6f25e6c396087633e2a12f347db1c5c13f78276eaff47d141c5da  /home/coder/ralph_collector/ralph-disk-alert.service
```

## Compile and default check

```text
python3 -m py_compile tools/collector/disk_alert.py
python3 tools/collector/disk_alert.py --path /home/coder/data --min-free-pct 101; echo default_exit=$?

disk_free_pct=43.23 path=/home/coder/data threshold=101.00
default_exit=2
```

## High-threshold send test

Used a separate test state file so the production 20% alert throttle state is not consumed:

```text
rm -f /home/coder/data/disk-alert-test-state.json
python3 tools/collector/disk_alert.py --path /home/coder/data --min-free-pct 99 --send-alert --state /home/coder/data/disk-alert-test-state.json --throttle-hours 6 --openclaw-bin /home/coder/.npm-global/bin/openclaw --channel telegram --target telegram:1539856256 --label 'RALPH disk alert TEST'

disk_free_pct=43.23 path=/home/coder/data threshold=99.00
OPENCLAW_SEND status=0
Sent via telegram. Message ID: 8186
```

Telegram readback check:

```text
/home/coder/.npm-global/bin/openclaw message read --channel telegram --target telegram:1539856256 --limit 3

GatewayClientRequestError: Error: Unsupported Telegram action: read
```

So OpenClaw accepted the send and returned Telegram message ID `8186`, but independent visible readback is unsupported for Telegram in this runtime.

## Throttle test

Immediate second run using the same test state did not send another Telegram message:

```text
disk_free_pct=43.23 path=/home/coder/data threshold=99.00
THROTTLED last_sent_iso=2026-10-10T06:41:19Z remaining_s=21552
```
