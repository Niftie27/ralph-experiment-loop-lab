import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('inventory', Path(__file__).with_name('inventory.py'))
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class TimeFieldsTest(unittest.TestCase):
    def inspect(self, rows):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'fixture.jsonl'
            path.write_text(''.join(json.dumps(row) + '\n' for row in rows))
            return inventory.inspect_file(path)

    def test_event_type_is_not_time(self):
        result = self.inspect([{'data': {'e': 'aggTrade', 'E': 1792234800000}, 'recv_ms': 1792234800001}])
        self.assertEqual(result['time_fields'], ['data.E', 'recv_ms'])
        self.assertNotIn('data.e:string', result['time_ranges'])

    def test_seconds_milliseconds_and_extrema(self):
        result = self.inspect([{'time': 1792234801, 't_ms': 1792234801000}, {'time': 1792234800, 't_ms': 1792234800000}])
        self.assertEqual(result['time_ranges']['time:integer'], [1792234800, 1792234801])
        self.assertEqual(result['time_ranges']['t_ms:integer'], [1792234800000, 1792234801000])

    def test_reject_non_integer_and_out_of_range(self):
        for value in ['1792234800', '2026-10-17T11:00:00Z', True, 1792234800.0, 0, -1, 1792234800000000]:
            with self.subTest(value=value):
                self.assertEqual(self.inspect([{'time': value}])['time_fields'], [])

    def test_mixed_field_is_not_time(self):
        self.assertEqual(self.inspect([{'time': 1792234800}, {'time': 'unknown'}])['time_fields'], [])

    def test_nested_arrays_null_and_non_time_ids(self):
        result = self.inspect([{'events': [{'timestamp': None}, {'timestamp': 1792234800000}], 'id': 1792234800}])
        self.assertEqual(result['time_fields'], ['events[].timestamp'])

    def test_epoch_bounds(self):
        for scale in [1, 1000]:
            self.assertTrue(inventory.epoch_integer(946684800 * scale))
            self.assertTrue(inventory.epoch_integer(4102444800 * scale - 1))
            self.assertFalse(inventory.epoch_integer(946684800 * scale - 1))
            self.assertFalse(inventory.epoch_integer(4102444800 * scale))


if __name__ == '__main__':
    unittest.main()
