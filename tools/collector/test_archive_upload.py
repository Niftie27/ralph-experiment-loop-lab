#!/usr/bin/env python3
import csv
import fcntl
import os
import sys
import tempfile
import time
import unittest
from contextlib import redirect_stdout
from io import StringIO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import archive_upload


NOW_TS = archive_upload.parse_hour_end_ts("2026-10-11T05Z") + 7200
OLD_MTIME = NOW_TS - 3600


class FakeRemote:
    def __init__(self):
        self.files = {}
        self.dirs = set()
        self.uploads = []
        self.commands = []
        self.upload_results = []
        self.fail_upload_for = set()

    def mkdir_p(self, remote_dir):
        self.commands.append(["ssh", "storagebox", "mkdir", "-p", remote_dir])
        self.dirs.add(remote_dir)

    def exists(self, remote_path):
        self.commands.append(["ssh", "storagebox", "stat", remote_path])
        return remote_path in self.files

    def sha256(self, remote_path):
        self.commands.append(["ssh", "storagebox", "sha256sum", remote_path])
        return archive_upload.hashlib.sha256(self.files[remote_path]).hexdigest()

    def upload(self, local_path, remote_dir):
        remote_path = f"{remote_dir}/{os.path.basename(local_path)}"
        if remote_path in self.fail_upload_for:
            raise RuntimeError("planned upload failure")
        self.commands.append(
            [
                "rsync",
                "-a",
                "--ignore-existing",
                "--partial-dir=.rsync-partial",
                "--bwlimit=20000",
                "-e",
                "ssh -o BatchMode=yes",
                local_path,
                f"storagebox:{remote_dir}/",
            ]
        )
        with open(local_path, "rb") as f:
            self.files.setdefault(remote_path, f.read())
        self.uploads.append((local_path, remote_path))
        result = {"local_path": local_path, "remote_dir": remote_dir, "elapsed_seconds": 1.0, "stdout": "", "stderr": ""}
        self.upload_results.append(result)
        return result


def write_file(path, content=b"data", mtime=OLD_MTIME):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)
    os.utime(path, (mtime, mtime))
    return path


def make_complete_hour(data, symbol="BTCUSDT", hour="2026-10-11T00Z", raw=b"raw", tape=b"tape", book=b"book"):
    write_file(os.path.join(data, f"raw_{symbol}_{hour}.jsonl.xz"), raw)
    write_file(os.path.join(data, f"tape_{symbol}_{hour}.csv.gz"), tape)
    write_file(os.path.join(data, f"book_{symbol}_{hour}.jsonl.gz"), book)


def rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def capture(fn, *args, **kwargs):
    out = StringIO()
    with redirect_stdout(out):
        result = fn(*args, **kwargs)
    return result, out.getvalue()


class ArchiveUploadTest(unittest.TestCase):
    def test_selection_excludes_live_raw_gzip_tmp_and_too_new_files(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            make_complete_hour(data)
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T07Z.jsonl.xz"))
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T07Z.csv.gz"))
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T07Z.jsonl.gz"))
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T01Z.jsonl.gz"))
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T02Z.jsonl.xz.tmp"))
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T03Z.jsonl.xz"), mtime=NOW_TS - 60)
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T03Z.csv.gz"))
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T03Z.jsonl.gz"))

            selected = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)

            self.assertEqual([(x.hour, x.kind) for x in selected], [
                ("2026-10-11T00Z", "raw"),
                ("2026-10-11T00Z", "tape"),
                ("2026-10-11T00Z", "book"),
                ("2026-10-11T03Z", "tape"),
                ("2026-10-11T03Z", "book"),
            ])

    def test_upload_verify_writes_pass_rows_and_remote_day_folders(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            archive_upload.upload_files(files, state, remote)

            self.assertEqual(len(remote.uploads), 3)
            self.assertIn("ralph/raw/BTCUSDT/2026-10-11", remote.dirs)
            self.assertIn("ralph/derived/BTCUSDT/2026-10-11", remote.dirs)
            self.assertEqual([row["status"] for row in rows(state)], ["PASS", "PASS", "PASS"])

    def test_remote_exists_matching_hash_records_pass_without_upload(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()
            for item in files:
                with open(item.local_path, "rb") as f:
                    remote.files[item.remote_path] = f.read()

            archive_upload.upload_files(files, state, remote)

            self.assertEqual(remote.uploads, [])
            self.assertEqual([row["status"] for row in rows(state)], ["PASS", "PASS", "PASS"])

    def test_remote_exists_different_hash_records_fail_and_keeps_remote(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()
            original = b"remote-different"
            remote.files[files[0].remote_path] = original

            with self.assertRaises(archive_upload.ArchiveError):
                archive_upload.upload_files([files[0]], state, remote)

            self.assertEqual(remote.files[files[0].remote_path], original)
            self.assertEqual(remote.uploads, [])
            self.assertEqual(rows(state)[0]["status"], "FAIL")

    def test_rerun_has_no_uploads_and_no_new_rows(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()
            archive_upload.upload_files(files, state, remote)
            before_rows = rows(state)

            second = FakeRemote()
            second.files = dict(remote.files)
            archive_upload.upload_files(files, state, second)

            self.assertEqual(second.uploads, [])
            self.assertEqual(rows(state), before_rows)

    def test_limit_applies_before_pass_skip(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data, hour="2026-10-11T00Z")
            make_complete_hour(data, hour="2026-10-11T01Z")
            first_hour = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)[:3]
            archive_upload.upload_files(first_hour, state, FakeRemote())

            selected = archive_upload.selected_files(
                ["BTCUSDT"],
                {"BTCUSDT": data},
                state,
                limit=1,
                now_ts=NOW_TS,
            )

            self.assertEqual([(item.hour, item.kind) for item in selected], [
                ("2026-10-11T01Z", "raw"),
                ("2026-10-11T01Z", "tape"),
                ("2026-10-11T01Z", "book"),
            ])

    def test_explicit_hour_after_pass_skips_three_files(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data, hour="2026-10-11T00Z")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            archive_upload.upload_files(files, state, FakeRemote())
            selected = archive_upload.selected_files(
                ["BTCUSDT"],
                {"BTCUSDT": data},
                state,
                limit=0,
                hours=["2026-10-11T00Z"],
                now_ts=NOW_TS,
            )

            _result, out = capture(archive_upload.upload_files, selected, state, FakeRemote())

            self.assertIn("SUMMARY uploads=0 verified_existing=0 skipped_pass=3 new_rows=0", out)
            self.assertEqual(len(rows(state)), 3)

    def test_failure_on_second_file_preserves_first_row_only(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data, hour="2026-10-11T00Z")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()
            remote.fail_upload_for.add(files[1].remote_path)

            with self.assertRaises(archive_upload.ArchiveError):
                archive_upload.upload_files(files, state, remote)

            state_rows = rows(state)
            self.assertEqual(len(state_rows), 1)
            self.assertEqual(state_rows[0]["kind"], "raw")

    def test_incomplete_hour_uploads_present_files_and_reports_missing(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T00Z.jsonl.xz"), b"raw")
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T00Z.csv.gz"), b"tape")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            _result, out = capture(archive_upload.upload_files, files, state, remote)

            self.assertIn("INCOMPLETE_HOURS count=1 BTCUSDT/2026-10-11T00Z/missing=book", out)
            self.assertEqual(len(remote.uploads), 2)
            self.assertEqual([row["kind"] for row in rows(state)], ["raw", "tape"])

    def test_pending_maintenance_reports_intermediate_not_incomplete(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T00Z.jsonl.gz"), b"raw-waiting")
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T00Z.csv"), b"tape-waiting")
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T00Z.jsonl.gz"), b"book")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            _result, out = capture(archive_upload.upload_files, files, state, remote)

            self.assertIn("PENDING_MAINTENANCE count=1 BTCUSDT/2026-10-11T00Z/missing=raw,tape", out)
            self.assertIn("INCOMPLETE_HOURS count=0", out)
            self.assertEqual(len(remote.uploads), 1)

    def test_true_incomplete_reports_when_no_final_or_intermediate(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T00Z.jsonl.gz"), b"book")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            _result, out = capture(archive_upload.upload_files, files, state, remote)

            self.assertIn("PENDING_MAINTENANCE count=0", out)
            self.assertIn("INCOMPLETE_HOURS count=1 BTCUSDT/2026-10-11T00Z/missing=raw,tape", out)
            self.assertEqual(len(remote.uploads), 1)

    def test_too_new_final_file_reports_pending_and_is_not_uploaded(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            now_ts = time.time()
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T00Z.jsonl.xz"), b"raw", mtime=now_ts - 5 * 60)
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T00Z.csv.gz"), b"tape", mtime=now_ts - 20 * 60)
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T00Z.jsonl.gz"), b"book", mtime=now_ts - 20 * 60)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=now_ts)
            remote = FakeRemote()

            _result, out = capture(archive_upload.upload_files, files, state, remote)

            self.assertIn("PENDING_MAINTENANCE count=1 BTCUSDT/2026-10-11T00Z/missing=raw reason=raw:too_new", out)
            self.assertIn("INCOMPLETE_HOURS count=0", out)
            self.assertNotIn("raw_BTCUSDT_2026-10-11T00Z.jsonl.xz", [os.path.basename(local) for local, _remote in remote.uploads])
            self.assertEqual([row["kind"] for row in rows(state)], ["tape", "book"])

    def test_old_final_file_is_selected_and_uploaded(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            now_ts = time.time()
            write_file(os.path.join(data, "raw_BTCUSDT_2026-10-11T00Z.jsonl.xz"), b"raw", mtime=now_ts - 20 * 60)
            write_file(os.path.join(data, "tape_BTCUSDT_2026-10-11T00Z.csv.gz"), b"tape", mtime=now_ts - 20 * 60)
            write_file(os.path.join(data, "book_BTCUSDT_2026-10-11T00Z.jsonl.gz"), b"book", mtime=now_ts - 20 * 60)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=now_ts)
            remote = FakeRemote()

            _result, out = capture(archive_upload.upload_files, files, state, remote)

            self.assertIn("PENDING_MAINTENANCE count=0", out)
            self.assertEqual([row["kind"] for row in rows(state)], ["raw", "tape", "book"])

    def test_main_lock_held_exits_zero_without_remote_calls(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            lock = os.path.join(root, "state", "archive-upload.lock")
            make_complete_hour(data)
            os.makedirs(os.path.dirname(lock), exist_ok=True)
            lock_fd = os.open(lock, os.O_RDWR | os.O_CREAT, 0o600)
            try:
                fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                remote = FakeRemote()

                code, out = capture(
                    archive_upload.main,
                    [
                        "--symbol",
                        "BTCUSDT",
                        "--data-btcusdt",
                        data,
                        "--state",
                        state,
                        "--lock",
                        lock,
                    ],
                    remote,
                )

                self.assertEqual(code, 0)
                self.assertIn("LOCKED another archive run is active", out)
                self.assertEqual(remote.commands, [])
            finally:
                os.close(lock_fd)

    def test_local_size_change_after_pass_exits_without_upload(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data, hour="2026-10-11T00Z")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()
            archive_upload.upload_files(files, state, remote)
            write_file(files[0].local_path, b"raw-changed", mtime=OLD_MTIME)
            changed_files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            second = FakeRemote()

            with self.assertRaises(archive_upload.ArchiveError):
                _result, out = capture(archive_upload.upload_files, changed_files, state, second)

            self.assertEqual(second.uploads, [])
            self.assertEqual(len(rows(state)), 3)

    def test_mkdir_once_per_remote_dir_per_run(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data, hour="2026-10-11T00Z")
            make_complete_hour(data, hour="2026-10-11T01Z")
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            archive_upload.upload_files(files, state, remote)

            mkdirs = [cmd for cmd in remote.commands if cmd[:3] == ["ssh", "storagebox", "mkdir"]]
            self.assertEqual(mkdirs, [
                ["ssh", "storagebox", "mkdir", "-p", "ralph/raw/BTCUSDT/2026-10-11"],
                ["ssh", "storagebox", "mkdir", "-p", "ralph/derived/BTCUSDT/2026-10-11"],
            ])

    def test_generated_commands_do_not_contain_delete(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            remote = FakeRemote()

            archive_upload.upload_files(files, state, remote)

            flat = " ".join(" ".join(cmd) for cmd in remote.commands)
            self.assertNotIn("--" + "delete", flat)

    def test_dry_run_prints_counts_without_network(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            state = os.path.join(root, "state", "archive-files.csv")
            make_complete_hour(data)
            files = archive_upload.candidate_paths(data, "BTCUSDT", now_ts=NOW_TS)
            out = StringIO()

            with redirect_stdout(out):
                archive_upload.dry_run_report(files, state)

            text = out.getvalue()
            self.assertIn("BTCUSDT raw count=1", text)
            self.assertIn("BTCUSDT tape count=1", text)
            self.assertIn("BTCUSDT book count=1", text)


if __name__ == "__main__":
    unittest.main()
