// Conformance probe (NOT a deviation): checks the full O6 line order of v6.2, which the suite only checks by regex (M16-M18, M43, M44 survived).
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, page, listPath, root, csv } from './support.mjs';

const SIX = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'HYPEUSDT'];
const CHECKS = ['missing_checksum', 'checksum', 'hash', 'archive', 'member', 'crc', 'routing', 'framing', 'fields', 'month', 'order', 'hour', 'interval'];
const ST = ['verified_nonempty', 'verified_empty', 'not_verified', ...CHECKS.map(c => 'excluded:' + c)];
const ERAS = ['era1', 'era2', 'era3'];
const MODS = ['f1-1m-format.mjs', 'f1-1m-store.mjs', 'f1-funding.mjs', 'h2-contract.mjs', 'vision-1m.mjs', 'vision-source.mjs', 'vision-transport.mjs'].map(f => 'module:experiments/strategy-destruction-filter/src/' + f);
const head = ['listing_pages', 'prefixes_received', ...SIX.map(s => 'dropped:' + s), 'symbols_listed', 'symbols_with_keys', 'noncanonical_names', 'keys_frozen'];
const names = t => t.split('\n').slice(0, -1).map(l => l.split(' ')[0]);

test('CONFORMANCE O6: full v6.2 line order incl. role_none_stops after h lines, era-major runs, first_pass before final', async () => {
 const body = csv(['2025-05-03T00:00Z', 8], ['2025-05-03T08:00Z', 1], ['2025-05-03T09:00Z', 1], ['2025-05-03T12:00Z', 4], ['2025-05-04T00:00Z', 4]);
 const r = await run(sources([{ symbol: 'A', month: '2025-05', body }], ['A', 'BTCUSDT']));
 const expected = [...head, ...ST.map(s => 'first_pass:' + s), ...ST.map(s => 'final:' + s), 'rows_o0',
  ...ERAS.flatMap(e => ['left_censored_segment', 'left_censored_window', 'observed'].map(s => 'runs_entry:' + e + ':' + s)),
  ...ERAS.flatMap(e => ['observed', 'right_censored_seal', 'right_censored_segment'].map(s => 'runs_exit:' + e + ':' + s)),
  'isolated_candidates', 'h:1', 'h:4', 'h:8', 'role_none_stops', 'sha256:symbols.txt', 'sha256:keys.txt', 'node', ...MODS];
 assert.deepEqual(names(text(r, 'summary.txt')), expected);
 assert.match(text(r, 'summary.txt'), /\ndropped:BTCUSDT true\ndropped:ETHUSDT false\n/);
 assert.match(text(r, 'summary.txt'), /\nrole_none_stops 1\n/);
});
test('CONFORMANCE O6 on the F1 branch: only the freeze items, node and module lines', async () => {
 const r = await run(new Map([[listPath(root), page([root + 'A,B/'])]]));
 assert.deepEqual(names(text(r, 'summary.txt')), [...head, 'node', ...MODS]);
});
