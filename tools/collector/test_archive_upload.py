#!/usr/bin/env python3
import csv
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
        remote_path = f"{remote_dir}/{os.path.basename(local_path)}"
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
