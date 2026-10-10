# Storage maintenance latency proof - 2026-10-10

Scope: state check, one active maintenance run, and live load test while that run was active.

## R4 state before proof

- Local repo HEAD: `9043ac6597e7dd0ce53e6148f0e099819ed491f0`.
- GitHub `main`: `9043ac6597e7dd0ce53e6148f0e099819ed491f0`.
- `/home/coder/ralph_collector/storage_maintenance.py` equals repo `tools/collector/storage_maintenance.py`.
- Installed user unit equals repo `tools/collector/ralph-storage-maintenance.service`.
- `systemctl --user show ... -p NeedDaemonReload` returned `NeedDaemonReload=no` for both the service and timer.
- No maintenance run was active before starting this proof.

Hashes:

```text
19e195e2e687aa6dd8d459f5283a58ae34c91e619510902a11005fbe88d55e37  tools/collector/storage_maintenance.py
19e195e2e687aa6dd8d459f5283a58ae34c91e619510902a11005fbe88d55e37  /home/coder/ralph_collector/storage_maintenance.py
f0ddc17b1cc97db59b59e311901dfc1d2a9bada77cace50561470d4491be15ed  tools/collector/ralph-storage-maintenance.service
f0ddc17b1cc97db59b59e311901dfc1d2a9bada77cace50561470d4491be15ed  /home/coder/ralph_collector/ralph-storage-maintenance.service
f0ddc17b1cc97db59b59e311901dfc1d2a9bada77cace50561470d4491be15ed  /home/coder/.config/systemd/user/ralph-storage-maintenance.service
```

## Run

Started one `ralph-storage-maintenance.service` run at `2026-10-10T15:47:36Z` and ran `loadtest_live.py` while it was active.

The maintenance run compressed one eligible completed hour, `2026-10-10T14Z`, for every symbol:

```text
BTCUSDT  gzip_tape source_sha256=29ee8815c6db3a683ca949fff79b2fb958e529ce4331ee23e59c9ccbb4c86e40 output_sha256=29ee8815c6db3a683ca949fff79b2fb958e529ce4331ee23e59c9ccbb4c86e40
BTCUSDT  xz_raw    source_sha256=66b59b73802e3e5ca450f6596c04888f1f2d8df2df850f06593ceec15ba83bf4 output_sha256=66b59b73802e3e5ca450f6596c04888f1f2d8df2df850f06593ceec15ba83bf4
ETHUSDT  gzip_tape source_sha256=99f45eee64c53f69568d88062e75de2991bc26b4eeba92fa3f0acb2b9478918c output_sha256=99f45eee64c53f69568d88062e75de2991bc26b4eeba92fa3f0acb2b9478918c
ETHUSDT  xz_raw    source_sha256=8f3ceab7f3645713399ea70aee5b5a1798fc6ab29de25e7b3a4c8c613ce70d3e output_sha256=8f3ceab7f3645713399ea70aee5b5a1798fc6ab29de25e7b3a4c8c613ce70d3e
SOLUSDT  gzip_tape source_sha256=d2975df1b1bee08a2298e64e6b916a5cc47e1ad5070980693bbe8070895ab77a output_sha256=d2975df1b1bee08a2298e64e6b916a5cc47e1ad5070980693bbe8070895ab77a
SOLUSDT  xz_raw    source_sha256=4753909f17a232e359c1308d9044786ec673e5860404dee2d06cbb8f04675c29 output_sha256=4753909f17a232e359c1308d9044786ec673e5860404dee2d06cbb8f04675c29
HYPEUSDT gzip_tape source_sha256=3faa0cb68430413431a746b18786147dea4af841ed96be8f9e7e740578b79c3f output_sha256=3faa0cb68430413431a746b18786147dea4af841ed96be8f9e7e740578b79c3f
HYPEUSDT xz_raw    source_sha256=1134f743c5571920d0bf395e8c29524ad2836982539a2c8efb6636b14ccb2b31 output_sha256=1134f743c5571920d0bf395e8c29524ad2836982539a2c8efb6636b14ccb2b31
```

The unit finished successfully at `2026-10-10T15:56:32Z` with `ExecMainStatus=0`.

## Load test result

Command:

```bash
/home/coder/venv-collector/bin/python /home/coder/ralph_collector/loadtest_live.py --collector /home/coder/ralph_collector/binance_live.py
```

Result:

```text
Test load: 8926 trades/s, 9874 bid/ask/s, depth 4465 levels every 100 ms
Delivered during burst: 5992 trades/s and 6643 bid/ask/s
Live dashboard during burst: typical 11 ms, 95% <= 22 ms, worst 32 ms
Worst collector lag: trades 28 ms, depth 20 ms, bid/ask 23 ms
Result: pass
```

All reported values were below Tomas's 100 ms stop threshold.
