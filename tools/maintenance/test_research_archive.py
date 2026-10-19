"""Small, synthetic safety checks; never touch real research paths or SSH."""
import csv
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

    def test_source_change_blocks_verify(self):
        initial = a.inventory()
        with self.assertRaises(a.ArchiveError):
            a.verify({}, initial)


if __name__ == '__main__':
    unittest.main()
