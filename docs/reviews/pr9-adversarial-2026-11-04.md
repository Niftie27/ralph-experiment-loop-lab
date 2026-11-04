# PR #9 adversarial review: make-before-break reconnect (2026-11-04)

Spec: agent document `cloud-pr9-adversarial` of 2026-11-04. Reviewer: Claude Code (cloud session). The reviewer did not write PR #9.
Claim labels follow `docs/findings.md` F08: **tested** (command and count given), **taken over** (source given), **reasoning**, **NOT VERIFIED**.

## 1. Versions, base, files

- Python 3.12.3, websockets 17.2. Tested: `python -c "import sys, websockets; print(sys.version, websockets.__version__)"` printed `3.12.3 (main, ...) 17.2`. The tests use unittest only. pyflakes (lint) was installed in the same scratch venv.
- Branch `claude/pr9-adversarial-uyxyzr`, created from 7b5fe01 (PR #9 head, branch `claude/new-session-vixh15`). main is 90b1f61.
- `tools/collector/binance_live.py` is byte-identical to 7b5fe01. Tested: `git diff --quiet 7b5fe01 -- tools/collector/binance_live.py` after every mutation revert and before the commit.
- New files, and nothing else changed:
  - `tools/collector/test_handover_adversarial.py`: 21 attack tests (A01-A60), plus 4 comparison tests against main that only exist when `PR9_MAIN_CODE` is set.
  - `tools/collector/soak_reconnect.py`: the soak wrapper.
  - `tools/collector/test_soak_reconnect.py`: 9 tests.
  - this report.
- Fake Binance: `FakeBinance` and the helpers are imported from `test_reconnect_handover.py`, not copied. The subclass `AdvFake` changes only the depth payloads: every update id gets its own price level and quantity, and every third update deletes a level. That way a lost, doubled or reordered depth update changes the final local book, and `assert_book_matches_server` compares that book with the server's truth. REST is mocked as in the existing tests. The soak test serves REST from a local HTTP server. Nothing contacts Binance.

## 2. Conflicts with repo instructions (this document's spec wins)

1. **Push branch.** The session's default git instruction was to develop and push on `claude/gracious-allen-uyxyzr`. The spec requires `claude/pr9-adversarial-<suffix>` from 7b5fe01. I followed the spec.
2. **MAP.md.** `AGENTS.md` (and `docs/findings.md` F21) say to update `docs/MAP.md` in the same change when the phase or the next step changes. The spec forbids modifying existing files, so MAP.md is unchanged. Reasoning: this review does not change the phase. If the owner takes "fix the PR #9 findings, then soak" as the new next step, MAP.md needs that in a separate change.
3. **Commit trailers.** `docs/findings.md` F14 says `git log -1 --format=%(trailers)` must be empty before a push, and the recent commits have no trailers. The session's default commit attribution consists of trailers. I followed the repo rule: the commit has no trailers and names Claude Code in its body. The session link is left out because the spec forbids host names.
4. **Read order.** `AGENTS.md` says to read `docs/MAP.md` and `docs/findings.md` first. The spec says it is self-contained. I read both after writing the tests and before this report and the commit. They contain nothing that changes the tests. F08 (labels) and F14 (trailers) were applied.
5. **Repeated automation.** `AGENTS.md` requires approval before automation that runs repeatedly. `soak_reconnect.py` is a bounded one-shot run (at most 4 h), not scheduled, and I did not run it on the VPS. Not a conflict; noted.
6. **Output checks on the target machine.** `docs/findings.md` F01 says checks that read program output are tested on a real sample from the target machine. The soak wrapper parses the collector's own report lines. That parsing is tested on the real collector output in this container (Python 3.12.3, websockets 17.2), not on the VPS: NOT VERIFIED on the VPS.
7. **Shell rule.** F13 refers to a CLAUDE.md shell rule (no heredocs, `$(...)`, `;` chains). No CLAUDE.md exists in this repo (checked with `find . -name CLAUDE.md`). My container commands used heredocs and chains. Nothing of that is committed.
8. **Host names.** The spec forbids committing host names. The tests use `localhost` (loopback, as `test_reconnect_handover.py` already does). No real host, IP, user name, key or token is in any new file (checked with a regex for IPv4 literals and home paths: no match).

## 3. Commands run and results

All commands ran from the repo root unless noted, with the Python 3.12.3 / websockets 17.2 venv. Its path is omitted; it is a scratch path outside the repo.

| # | Command | Result |
|---|---|---|
| 1 | `python -m unittest discover -s tools/collector -p "test_reconnect_handover.py" -v` | 13 run, 13 pass. Run at the start and again at the end; same result. |
| 2 | `python -m unittest discover -s tools/collector -p "test_binance_live.py" -v` | 2 run, 2 pass (twice) |
| 3 | `python -m unittest discover -s tools/collector -p "test_handover_adversarial.py" -v` | 21 run, **12 pass, 9 fail**. Two full runs, the same 9 failed. |
| 4 | `python -m unittest discover -s tools/collector -p "test_soak_reconnect.py" -v` | 9 run, 9 pass. The 10 s soak run made 6 handovers per endpoint. |
| 5 | `git show 90b1f61:tools/collector/binance_live.py > <tmp>/bl_main.py`, then in `tools/collector`: `PR9_MAIN_CODE=<tmp>/bl_main.py python -m unittest test_handover_adversarial.MainComparisonTest -v` | 4 run, 4 pass (twice) |
| 6 | `python -m unittest discover -s tools/collector -p "test_*.py"` (every collector test together) | 88 run, 79 pass, 9 fail: the same 9 as row 3 |
| 7 | 6 mutation runs (section 6): apply, run the target test, `git checkout -- tools/collector/binance_live.py`, check clean, rerun the target test unmutated | each mutated run failed; each unmutated rerun passed |
| 8 | `python -m pyflakes` on the three new .py files | clean |

My own tests needed several rounds before these counts. Bugs I found in my tests and fixed (none is a PR finding):
- NEW started "behind" before tick 0, a negative list index in the fake.
- A buffer-size bound that was too high for the market stream mix.
- A40 checked key order, which is A41's job.
- A50's plans applied to the initial connections.
- A22's first leak criterion counted Handover objects waiting for the cyclic GC (see O1).
- A display issue: unittest shortened the A03 failure message and hid the bookTicker part. Failure messages now print the full problem dict.

## 4. Findings

Line numbers are in `tools/collector/binance_live.py` at 7b5fe01. All 9 failing tests fail on purpose and are left failing (no skip, no expectedFailure). Fail counts below are from command 3, run 2.

| id | severity | file:line (7b5fe01) | what happens | failing test | main 90b1f61 the same? |
|---|---|---|---|---|---|
| F1 | major | 861-862, 871, 899; 907-913; 819, 825 | **A NEW that opens but sends nothing is never given up.** HANDOVER_MAX_S counts from NEW's first message (871). `_switch_reason` returns None while the buffer is empty (861-862), and the wait has no timeout before that first message (899). Result: no failure recorded, no log line, no retry, and OLD keeps going. Tested (A11): 8 s after NEW opened, there were 0 failures, 2 connection attempts and nothing logged. When OLD then ends (a server close frame, as Binance's 24 h cut would be), the pending handover switches to the silent NEW with reason `old_ended` (907-913), and the endpoint records nothing. Tested (A12): 0 aggTrades in the 3 s after OLD's close. `run_endpoint` sat in `recv()` (819) and had to be cancelled; stop alone does not end it. The deadline check (825) runs only after a message, so this lasts until NEW's own 24 h cut. Reasoning: the aggTrade gap after that is more than 300 000 ids, so `handle()` (720-723) skips it instead of backfilling it. | `test_a11_new_opens_but_sends_nothing`, `test_a12_silent_new_then_old_closed_by_server` | **Partly.** main has no data-silence watchdog either: a silent connection after main's scheduled reconnect records nothing (tested: `test_m12_...` passes, 0 aggTrades in 3 s). So for the same server behaviour the PR does not lose more than main. But it fails two of the spec's four criteria (one retry, logged), and it keeps a silent NEW pending for up to 10 min and then takes it. |
| F2 | minor | 863-870 | **The switch only checks the streams NEW has already sent.** A NEW without markPrice (market) or bookTicker (public) passes as `caught_up`, and those streams stop for good: 0 messages more than 0.3 s after the switch. The switch report lists dropped duplicates but not the missing stream. Tested (A13). | `test_a13_new_sends_only_some_streams` | **Yes** (tested: `test_m13_...` passes; main's reconnect onto such a connection loses the same streams) |
| F3 | minor | 863-870 | Same root cause, timing variant. OLD lags 0.3 s, and NEW's markPrice and bookTicker start 0.5 s after its other streams. The `caught_up` switch closes OLD before it delivered events NEW never sends. Tested: 5 markPrice and 50 bookTicker events missing. Whether Binance can start the streams of one combined connection at different moments: NOT VERIFIED. | `test_a03_new_streams_start_at_different_moments` | **No, main loses more.** Tested `test_m01_...`: 10.0-10.2 s of silence on every stream at main's scheduled reconnect. |
| F4 | minor | 871-872, 939 | **A forced `max_time` switch discards what a live but slow OLD has not processed yet.** OLD keeps delivering but runs 2.6 s behind with HANDOVER_MAX_S 2.0 s (production: more than 3 s behind, e.g. a backlog in the collector itself). The switch closes OLD (939) with messages NEW never had. Tested: 5 markPrice, 14 forceOrder, 54 bookTicker and 54 depth events lost, 1 book resync (REST snapshot), and 54 aggTrades refilled from REST. Existing H4 accepts this for an OLD that stalls; here OLD was still advancing. Whether such lags occur on the VPS: NOT VERIFIED. | `test_a05_old_alive_but_lags_more_than_max` | **No, main loses more** (tested, `test_m01_...`) |
| F5 | minor | 825, 1004 | **No notion of Binance's 24 h hard limit.** After a failed handover it retries every HANDOVER_RETRY_S without end. No fallback to the old break-and-reconnect, and no log line naming OLD's age or the limit. Tested with production RECONNECT_AFTER_S, every NEW refused, and the clock moved so OLD is 24 h + 1 s old: 6 failed handovers, only lines like `... stare bezi dal, dalsi pokus nejdriv za 0.4 s`. Reasoning: when Binance then cuts OLD, `_read` returns silently on ConnectionClosedOK (820-821), or the error path runs. Either way the loss is about that of one normal reconnect. | `test_a20_failed_handovers_past_the_24_h_limit` | **No.** main breaks every connection unconditionally at RECONNECT_AFTER_S (reasoning, from main's `run_endpoint`). |
| F6 | minor | 844, 847, 948-949; `Recorder._raw_file` 243-251 | **Raw lines leave key order at an hour boundary.** With OLD lagging, the buffered NEW messages are written with their earlier true receive times, after OLD's later lines. When the top of the hour falls inside the overlap, the previous hour's raw file is reopened and appended after the new hour's file was started. Each event is still in the file of its recv_ms hour exactly once (A40 passes). But reading the hour files in order (as a book rebuild would) gives 3 depth `pu` breaks; aggTrade goes back (5000274 then 5000249) and bookTicker goes back. Reasoning from reading the code, not run: `data_checks.py` and `rebuild_from_raw.py` key aggTrades by id, and no depth rebuild exists in the repo, so nothing in the repo breaks today. | `test_a41_hour_boundary_inside_overlap_write_order` | **No.** main writes in processing order with processing-time recv_ms (reasoning, not run) |
| F7 | nit | 844, 948-949 | Same root cause without an hour boundary: with OLD lagging 0.5 s, recv_ms per stream goes back by up to 491 ms within one raw file, on 45 lines each for aggTrade, depth and bookTicker and 4 for markPrice (tested). | `test_a42_recv_ms_order_within_file` | **No.** main's recv_ms is the processing time and does not go back, barring clock steps (reasoning) |
| F8 | nit | 941, 955 | **The duplicate filter ends after a fixed HANDOVER_FILTER_S.** A NEW running steadily behind OLD by more than that (scaled: 1.5 s lag vs a 1.0 s filter; production: more than 10 s) writes duplicates after the window. Tested: 44 aggTrade, 4 markPrice, 44 depth, 44 bookTicker, and the stale depth diff resynced the book once. Existing H12 accepts this ("recorded as today") for one injected message. Realism: low. | `test_a04_new_lags_old_longer_than_filter` | **No.** main has one connection and cannot duplicate (reasoning) |

Observations, not defects:
- **O1** A switched `Handover` (with its buffer) is freed only by the cyclic GC: the cancelled reader task's traceback refers back to it. Tested by a scratch probe with gc disabled: 1 alive after the switch, 0 after `gc.collect()`. A22 shows the count bounded over 50 handovers and 0 at the end. Memory is held until the next GC pass, at most `HANDOVER_BUFFER_MAX` messages per endpoint.
- **O2** The PR's motivating problem is reproduced in the fake. When the server ignores the client's close, main's scheduled reconnect waits close_timeout and every stream is silent 10.0-10.2 s (tested `test_m01_...`). Production measured 7.1-10.0 s (taken over from the spec). With the same server behaviour the PR switches with a gap of at most 300 ms (existing H1, tested).
- **O3** `stop` alone does not end `run_endpoint` while it sits in `recv()` on a connection that sends nothing; main behaves the same (`test_m12_...` needed cancel too). The production stop goes through `Collector.main()`, which cancels the tasks, so SIGTERM still ends the process: tested A50 for the PR and `test_m50_...` for main.

## 5. Coverage of attack items 1-8

Existing tests (all pass, command 1) and which attack each covers:
- **H1**: normal handover, server ignores close. Exactly once, gap at most 300 ms, no resync.
- **H2**: NEW 0.3 s behind; replay dropped.
- **H3**: OLD lags 0.3 s.
- **H4**: OLD stalls; `max_time`, backfill, one resync.
- **H5**: different depth batching.
- **H6**: NEW refused, then retry.
- **H7**: NEW drops TCP during the overlap, then retry.
- **H8**: forceOrder pairs.
- **H9**: bookTicker parsed only during a handover.
- **H10**: stop during a handover, via `run_endpoint`.
- **H11**: error path unchanged.
- **H12**: backwards aggTrade after the filter.
- **H13**: buffer cap.

| item | tests | result |
|---|---|---|
| 1 exactly once, several-second overlap | H1, H2, H3, H8, H13 (existing); A01 (OLD 2.5 s behind while both deliver, production HANDOVER_MAX_S 3 s, forceOrder included); A02 (NEW 3 s behind OLD inside a 5 s filter: 3 s of identical events); A15; A22 (50 handovers) | pass. A03 FAIL (F3), A05 FAIL (F4), A04 FAIL (F8) |
| 2 depth chain, no snapshot or resync, book == server book | H1, H3, H13 (existing); A01, A02, A15, A22: no `pu` break in write order, exactly one REST depth snapshot, resyncs unchanged, local book == server book replayed from the generator | pass. A41 FAIL (F6), A05 FAIL (F4) |
| 3 failures during a handover | refused: H6. Open timeout: A10. NEW silent: A11, A12. Only some streams: A13, A03. NEW disconnects in the overlap: H7. Close frame to NEW at once: A14. OLD aborted or closed in the overlap: A15. OLD aborted before NEW is open: A60. Both die: A16. One retry and never two NEWs (attempt counts and spacing of at least HANDOVER_RETRY_S): A10, A14, A16, A60, H6, H7 | H6, H7, A10, A14, A15, A16, A60 pass. A11, A12 FAIL (F1). A13 FAIL (F2). A03 FAIL (F3) |
| 4 timing, 24 h, leaks | A20: failed handovers past 24 h. A21: the next handover counts from NEW's open, not from the switch or the failed attempt. A22: 50 handovers per endpoint; tasks, fds and closing tasks do not rise between handovers, Handover objects alive after gc are at most 2, everything back at baseline (fds, tasks, 0 Handover objects, 1 open connection per endpoint on the server side) | A21, A22 pass. A20 FAIL (F5) |
| 5 REST gap fill | no spurious fill: H1-H3, H13, A01, A02, A10, A15, A22 assert no backfill. A30: a backfill held open across a handover completes, each id once (ws or rest), tape complete, no second backfill | pass |
| 6 hour boundary | A40: clocks of the collector and the fake shifted so the top of the hour falls inside the overlap; every raw line in its recv_ms hour file, every event exactly once over both hours, every trade once in its T-hour tape. A41: write order across the hour files | A40 pass. A41 FAIL (F6) |
| 7 shutdown | H10: stop via `run_endpoint`. A50: SIGTERM via `Collector.main()` while one NEW buffers and the other is opening, then asyncio.run's teardown; output ends with `ulozeno, konec`, every gz file readable, tapes sorted, no `.tmp`, no loop error, the server sees every connection closed. `test_m50_...`: main the same. Soak test: SIGTERM stop path | pass |
| 8 other | A42 (recv_ms order), A60 (OLD ends while NEW opens: today's path), O1-O3 | A60 pass. A42 FAIL (F7) |

## 6. Mutations (tested; applied, run, reverted, never committed)

| id | mutation in binance_live.py | target test | mutated | unmutated |
|---|---|---|---|---|
| M1 | `_filter`: `key <= last` → `key < last` | A02 `test_a02_new_lags_3_s_inside_filter` | FAIL: 1 duplicate aggTrade (5000411) | pass |
| M2 | `_switch`: `ep.started = h.open_wall` → `ep.started = time.time()` | A21 `test_a21_next_handover_counts_from_new_open` | FAIL: next handover 2.07 s after NEW opened (limit < 1.6 s) | pass |
| M3 | `_close_in_background`: `task.add_done_callback(tasks.discard)` → `pass` | A22 `test_a22_fifty_handovers_leak_nothing` | FAIL: closing tasks never drained (15 s timeout) | pass |
| M4 | `_abort_handover`: `ep.retry_at = time.time() + HANDOVER_RETRY_S` → `ep.retry_at = 0.0` | A10 `test_a10_new_open_times_out` | FAIL: retry 0.50 s after the failed attempt (needs ≥ 1.0 s) | pass |
| M5 | `_during_handover`: `reason = "old_ended"; break` → `raise` | A15 `test_a15_old_ends_during_overlap` | FAIL: error path taken (`spojeni market spadlo (`) | pass |
| M6 | `_switch`: `ep.filter_until = now + HANDOVER_FILTER_S` → `ep.filter_until = now` | A01 `test_a01_old_lags_2_5_s_overlap_identical_events` | FAIL: 1 duplicate aggTrade (5000410) | pass |

## 7. Part 2: soak wrapper

`tools/collector/soak_reconnect.py`:
- Takes `--symbol`, `--out`, `--reconnect-after-s` (default 300, refused below 60) and `--duration-s` (refused above 14400 or at 0 or below).
- Imports `binance_live` from its own directory. It refuses a `binance_live.py` without the handover, i.e. one that is not the PR #9 collector.
- Sets `binance_live.RECONNECT_AFTER_S` and runs `binance_live.main()` in-process with `--symbol <s> --all --quiet --out <out>`. Never `--features`.
- Refuses (exit 2, nothing created) an `--out` that exists and is not an empty directory, or a dangling symlink; and an `--out` that resolves to `~/data` or inside it, or to a `SOAK_FORBIDDEN` entry or inside one.
- After `--duration-s` it sends itself SIGTERM, which is the collector's normal shutdown path, and exits 0.
- For each collector report line `predavani <endpoint>: prepnuto ...` it prints `SOAK handover <UTC> <endpoint>`. That time is when the collector printed the report: at the end of the duplicate filter (about HANDOVER_FILTER_S after the switch), at the next switch, or at shutdown. Failed handovers and error reconnects are printed the same way.

`binance_live.py` is not changed.

Tested (command 4):
- Guards: non-empty `--out`, a file, a dangling symlink; `~/data` itself, inside it, through `..` and through a symlink; `~/data` itself a symlink; `SOAK_FORBIDDEN` with several entries, equal and nested; a sibling with the same prefix allowed; limits; NaN; missing required arguments; no CLI option for the minimum.
- Argument wiring: the collector arguments, RECONNECT_AFTER_S, and the line parsing.
- A 10 s subprocess soak against the fake: WebSocket from `test_reconnect_handover.py`, REST from a local HTTP server; reconnect after 1.5 s with the minimum lowered through the test-only `min_reconnect_s` argument. Results:
  - 6 handovers per endpoint, and the `SOAK handover` lines match the collector's own reports.
  - Exit 0 with `ulozeno, konec`.
  - Raw flushed to within 1 s of the stop, tapes finalized.
  - Every aggTrade, depth, markPrice, forceOrder and bookTicker exactly once and in order (the same check as part 1), no `pu` break, exactly one REST depth snapshot, no aggTrades REST call.

Suggested VPS use (not run, NOT VERIFIED on the VPS):

```
SOAK_FORBIDDEN=<live data dirs> ~/venv/bin/python tools/collector/soak_reconnect.py --symbol ethusdt --out ~/soak/eth-1 --duration-s 7200
```

It adds two WebSocket connections and REST weight from the same IP as the live collectors: a depth snapshot at start, open interest every 10 s, and a backfill only on a gap.

## 8. What I could not test, and why

- **Real Binance behaviour** (no network access to Binance by rule), all NOT VERIFIED:
  - whether the 24 h cut is a close frame or a dropped TCP connection;
  - whether bookTicker `u` is unique per message (the filter drops `u <= last`);
  - whether the streams of one combined connection can start at different moments (F3);
  - whether two connections can differ in latency by more than 3 s, or a local backlog can grow that large (F4);
  - whether a connection can stay open, answer pings and send nothing (F1).
- **The VPS:** not touched. The soak wrapper was not run there. Behaviour under the real 4-symbol load and memory over 24 h were not measured; A22 covers 50 + 50 handovers in about 15 s.
- **SIGTERM to a real `binance_live.py` process:** tested through `Collector.main()` in-process with `os.kill` (A50) and through the soak subprocess, which sends SIGTERM to itself. Not tested under systemd.
- **Wall-clock hour boundary:** simulated by shifting `time.time` in `binance_live` and the fake server; monotonic time was unchanged.
- **Message rates:** the fake sends about 100 ticks/s, about 1.3 market and 2 public messages per tick. Thousands of messages per second were not tested.
- **orjson path:** orjson is not installed, so `json.loads` was used. Python 3.13 was not run (the spec requires 3.12).
- **Comparisons with main:** the main tests cover only F1, F2, F3/F4 (the 10 s silence, m01) and shutdown. F5-F8 for main are reasoning from main's code.
