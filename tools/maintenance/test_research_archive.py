"""Small, synthetic safety checks; never touch real research paths or SSH."""
import csv
import json
import os
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('archive', Path(__file__).with_name('research_archive.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)


class SafetyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.roots = {s: self.base / s for s in ('S1', 'S2')}
        for root in self.roots.values():
            root.mkdir()
            (root / 'a.csv').write_text('a,b\n1,2\n')
        self.root_patch = patch.object(a, 'ROOTS', self.roots)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.addCleanup(self.tmp.cleanup)

    def test_paths_reject_escape(self):
        for value in ('../a', '/a', 'x/../../a', 'a;id', 'a\nb'):
            with self.assertRaises(a.ArchiveError):
                a.safe_rel(value)

    def test_inventory_rejects_symlink(self):
        (self.roots['S1'] / 'link.csv').symlink_to(self.roots['S1'] / 'a.csv')
        with self.assertRaises(a.ArchiveError):
            a.inventory()

    def test_manifest_unique_roundtrip(self):
        manifest = self.base / 'manifest.csv'
        row = dict(zip(a.FIELDS, ['S2', 'a.csv', '8', 'hash', 'a.csv', '8', 'hash', 'hash', 'none', 'PASS']))
        a.save_manifest(manifest, {('S2', 'a.csv'): row})
        self.assertEqual(a.read_manifest(manifest)[('S2', 'a.csv')], row)
        with manifest.open('a', newline='') as f:
            csv.DictWriter(f, fieldnames=a.FIELDS).writerow(row)
        with self.assertRaises(a.ArchiveError):
            a.read_manifest(manifest)

    def test_inaccessible_proc_blocks_all_deletion(self):
        initial = a.inventory()
        report = {s: {} for s in self.roots}
        scan = {'hits': [], 'inaccessible_pids': ['1'], 'status': 'not verified'}
        with patch.object(a, 'proc_scan', return_value=scan), patch.object(a.time, 'sleep'):
            with self.assertRaises(a.ArchiveError):
                a.delete_verified(dict.fromkeys(initial), initial, report, self.base / 'report.json')
        self.assertEqual(a.inventory(), initial)

    def test_new_file_blocks_all_deletion(self):
        initial = a.inventory()
        (self.roots['S2'] / 'new.csv').write_text('new')
        with self.assertRaises(a.ArchiveError):
            a.delete_verified(dict.fromkeys(initial), initial, {}, self.base / 'report.json')
        self.assertTrue((self.roots['S1'] / 'a.csv').exists())

    def test_exact_manifest_deletion(self):
        initial = a.inventory()
        report = {s: {} for s in self.roots}
        scan = {'hits': [], 'inaccessible_pids': [], 'status': 'PASS'}
        with patch.object(a, 'proc_scan', return_value=scan), patch.object(a, 'df', return_value='synthetic'):
            a.delete_verified(dict.fromkeys(initial), initial, report, self.base / 'report.json')
        self.assertTrue(all(not p.exists() for p in self.roots.values()))
        self.assertTrue(all(report[s]['local_removed'] for s in self.roots))

    def evidence(self, body='RESULT: PASS\nunreadable=0 hits=0\n'):
        path = self.base / 'sudo.txt'
        path.write_text(body)
        return path

    def test_sudo_evidence_rejects_stale_future_and_bad_fields(self):
        for body in ('RESULT: FAIL\nunreadable=0 hits=0',
                     'RESULT: PASS\nunreadable=1 hits=0',
                     'RESULT: PASS\nunreadable=0 hits=10',
                     'RESULT: PASS\nunreadable=0'):
            with self.assertRaises(a.ArchiveError):
                a.sudo_evidence(self.evidence(body))
        path = self.evidence()
        for age in (7200, -100):
            with patch.object(a.time, 'time', return_value=path.stat().st_mtime + age):
                with self.assertRaises(a.ArchiveError):
                    a.sudo_evidence(path)

    def test_sudo_evidence_allows_denied_but_never_own_hits(self):
        initial = a.inventory()
        report = {s: {} for s in self.roots}
        evidence = self.evidence()
        scan = {'hits': ['123:4'], 'inaccessible_pids': ['1'], 'status': 'not verified'}
        with patch.object(a, 'proc_scan', return_value=scan):
            with self.assertRaises(a.ArchiveError):
                a.delete_verified(dict.fromkeys(initial), initial, report, self.base / 'report.json', evidence)
        self.assertEqual(a.inventory(), initial)
        scan = {'hits': [], 'inaccessible_pids': ['1'], 'status': 'not verified'}
        with patch.object(a, 'proc_scan', return_value=scan), patch.object(a, 'df', return_value='synthetic'):
            a.delete_verified(dict.fromkeys(initial), initial, report, self.base / 'report.json', evidence)
        self.assertTrue(all(not p.exists() for p in self.roots.values()))

    def test_w1b_count_and_local_hash_gates(self):
        rows, initial = {}, {}
        for name, count in (('S1', 289), ('S2', 347)):
            for i in range(count):
                key = (name, str(i))
                initial[key] = (0, 0, 8)
                rows[key] = {'status': 'PASS', 'bytes': '8', 'sha256': 'a'*64,
                             'stored_sha256': 'b'*64, 'remote_sha256': 'b'*64}
        prior = self.base / 'prior.json'
        prior.write_text(json.dumps({'fresh_hashes': '636/636 PASS',
            'restore': [{'status': 'PASS'}]*3, 'S1': {'PASS': 289}, 'S2': {'PASS': 347}}))
        with patch.object(a, 'sha', return_value='a'*64), patch.object(a, 'inventory', return_value=initial):
            self.assertEqual(len(a.verify_w1b(rows, initial, prior)), 3)
            rows[('S1', '0')]['sha256'] = 'c'*64
            with self.assertRaises(a.ArchiveError):
                a.verify_w1b(rows, initial, prior)
            rows.pop(('S1', '0'))
            with self.assertRaises(a.ArchiveError):
                a.verify_w1b(rows, initial, prior)

    def test_source_change_blocks_verify(self):
        initial = a.inventory()
        with self.assertRaises(a.ArchiveError):
            a.verify({}, initial)


if __name__ == '__main__':
    unittest.main()
