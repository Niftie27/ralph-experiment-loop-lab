// m9 review probe (seal): I2 sealed routing, D segments, P0 verified_empty scope, no rate or sealed value in any output. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, status, text, time, csv } from './support.mjs';

const rows = (...r) => r.map(([t, h, rate]) => time(t) + ',' + h + ',' + rate + '\n').join('');
// P0 lists verified_empty only for months 2025-04 to 2025-09; a 2025-10 file with only sealed rows is verified_empty but no P0 reason.
test('SEAL-1 P0/O13: a 2025-10 file with only sealed rows is verified_empty and gives no verified_empty reason', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-09', body: csv(['2025-09-30T00:00Z', 8], ['2025-09-30T08:00Z', 8]) }, { symbol: 'A', month: '2025-10', body: 'calc_time,funding_interval_hours,last_funding_rate\n' + rows(['2025-10-17T00:00Z', 1, 'x'], ['2025-10-17T01:00Z', 1, 'y']) }]));
 status(r, 'A', '2025-10', 'verified_empty');
 assert.ok(!text(r, 'outcome.csv').includes('verified_empty'));
 assert.ok(!text(r, 'outcome.csv').includes(',P0,'));
});
// Definitions: any month status other than verified_nonempty (here verified_empty) breaks the segment; no pair crosses it.
test('SEAL-2 Definitions/D: a verified_empty month breaks the segment; the next month starts segment 2 without predecessor', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-05', body: csv(['2025-05-31T16:00Z', 8]) }, { symbol: 'A', month: '2025-06', body: '' }, { symbol: 'A', month: '2025-07', body: csv(['2025-07-01T00:00Z', 8]) }]));
 status(r, 'A', '2025-06', 'verified_empty');
 assert.equal(text(r, 'timing.csv'), 'symbol,segment,calc_time,funding_interval_hours\nA,1,' + time('2025-05-31T16:00Z') + ',8\nA,2,' + time('2025-07-01T00:00Z') + ',8\n');
 assert.ok(text(r, 'pairs.csv').endsWith('A,2,,,' + time('2025-07-01T00:00Z') + ',8,,unclassified,era2,false,false,\n'));
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,verified_empty\n');
});
// I2 order compares with the previous pre-seal row only: sealed rows in a 2025-10 file are skipped, pre-seal order still applies.
test('SEAL-3 I2: in a 2025-10 file pre-seal order skips sealed rows (ok) and still fails a later earlier pre-seal row (order)', async () => {
 const ok = await run(sources([{ symbol: 'A', month: '2025-10', body: rows(['2025-10-01T00:00Z', 8, 'a'], ['2025-10-20T00:00Z', 3, 'b'], ['2025-10-01T08:00Z', 8, 'c']) }]));
 status(ok, 'A', '2025-10', 'verified_nonempty');
 assert.equal(text(ok, 'timing.csv'), 'symbol,segment,calc_time,funding_interval_hours\nA,1,' + time('2025-10-01T00:00Z') + ',8\nA,1,' + time('2025-10-01T08:00Z') + ',8\n');
 const bad = await run(sources([{ symbol: 'A', month: '2025-10', body: rows(['2025-10-02T00:00Z', 8, 'a'], ['2025-10-20T00:00Z', 3, 'b'], ['2025-10-01T08:00Z', 8, 'c']) }]));
 status(bad, 'A', '2025-10', 'excluded:order');
});
// O: no rate in any output but raw O7 bytes; I2/O6: no sealed calc_time, h or count in any output; O4 no 2025-10 size.
test('SEAL-4 O/I2/O4/O6: distinctive rates and sealed rows never appear in any output except raw fixture bytes', async () => {
 const RATE = ['0.00012345678', '-0.0098765432', '7.77E-5'], SEALED = ['2025-10-17T00:00Z', '2025-10-17T01:00Z', '2025-10-31T23:00Z'];
 const r = await run(sources([
  { symbol: 'A', month: '2025-04', body: rows(['2025-04-30T16:00Z', 8, RATE[0]]) },
  { symbol: 'A', month: '2025-05', body: rows(['2025-05-01T00:00Z', 8, RATE[1]], ['2025-05-01T08:00Z', 1, RATE[2]], ['2025-05-01T09:00Z', 1, RATE[0]]) },
  { symbol: 'A', month: '2025-06', body: rows(['2025-06-01T00:00Z', 8, RATE[0]]) }, { symbol: 'A', month: '2025-07', body: rows(['2025-07-01T00:00Z', 8, RATE[1]]) },
  { symbol: 'A', month: '2025-08', body: rows(['2025-08-01T00:00Z', 8, RATE[2]]) }, { symbol: 'A', month: '2025-09', body: rows(['2025-09-01T00:00Z', 8, RATE[0]]) },
  { symbol: 'A', month: '2025-10', body: rows(['2025-10-16T16:00Z', 8, RATE[1]], ...SEALED.map(t => [t, 7, RATE[2]])) }]));
 assert.equal(r.code, 0); status(r, 'A', '2025-10', 'verified_nonempty');
 for (const [p, b] of Object.entries(r.files)) {
  if (/^fixtures\/[^/]+\.zip$/.test(p)) continue;
  const s = b.toString('latin1');
  for (const v of [...RATE, ...SEALED.map(time), 'h:7']) assert.ok(!s.includes(v), p + ' contains ' + v);
 }
 assert.match(text(r, 'summary.txt'), /\nrows_o0 9\n/);
 assert.equal(text(r, 'manifest.csv').split('\n').find(l => l.startsWith('A,2025-10,')).split(',')[4], '');
});
