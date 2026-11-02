// m9 fix batch, Phase A: tests for the D1 test gaps (surviving mutants). Every expected value comes from the
// spec v6.2 clause named in the test; the mutant id it kills is in parentheses.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, status, csv, time, page, listPath, root, key, zip, digest } from './support.mjs';
import { Abort } from '../m9-scan.mjs';

const PAIRS = 'symbol,segment,p_calc_time,p_h,r_calc_time,r_h,elapsed_h,class,era,cross_era,tree,roles\n';
const NAME = 'A-fundingRate-2025-05.csv';
const cdAt = z => z.readUInt32LE(z.length - 6);
const patched = edit => { const z = zip(NAME, csv(['2025-05-01T00:00Z', 8])); edit(z, cdAt(z)); return z; };
const one = async (entry, month = '2025-05') => { const r = await run(sources([{ symbol: 'A', month, ...entry }])); assert.equal(r.code, 0); return r; };
const T = time;

// I1 member, archive and crc.
test('I1 member (M01): ASCII name with flags 0x0008 in both headers is excluded:member', async () => {
 status(await one({ zip: patched((z, c) => { z.writeUInt16LE(8, 6); z.writeUInt16LE(8, c + 8); }) }), 'A', '2025-05', 'excluded:member');
});
test('I1 member (M02): local flags 0x0008 that differ from central flags 0 are excluded:member', async () => {
 status(await one({ zip: patched(z => z.writeUInt16LE(8, 6)) }), 'A', '2025-05', 'excluded:member');
});
test('I1 archive (M03): a trailing archive comment of the declared length is allowed', async () => {
 const z0 = zip(NAME, csv(['2025-05-01T00:00Z', 8])), z = Buffer.concat([z0, Buffer.from('abc')]);
 z.writeUInt16LE(3, z0.length - 2);
 status(await one({ zip: z }), 'A', '2025-05', 'verified_nonempty');
});
test('I1 archive (M04): disk number start 1 in the central record is excluded:archive', async () => {
 status(await one({ zip: patched((z, c) => z.writeUInt16LE(1, c + 34)) }), 'A', '2025-05', 'excluded:archive');
});
for (const [field, at] of [['compressed size', 20], ['uncompressed size', 24], ['local header offset', 42]])
 test('I1 archive (M05): zip64 marker 0xFFFFFFFF as ' + field + ' in the central record is excluded:archive', async () => {
  status(await one({ zip: patched((z, c) => z.writeUInt32LE(0xffffffff, c + at)) }), 'A', '2025-05', 'excluded:archive');
 });
test('I1 crc (M35): inflated length different from the declared size (CRC still correct) is excluded:crc', async () => {
 status(await one({ zip: patched((z, c) => z.writeUInt32LE(z.readUInt32LE(c + 24) + 1, c + 24)) }), 'A', '2025-05', 'excluded:crc');
});

// I2 grammar.
test('I2 routing (M36): a 14-digit calc_time token is excluded:routing', async () => {
 status(await one({ body: '0' + T('2025-05-01T00:00Z') + ',8,x\n' }), 'A', '2025-05', 'excluded:routing');
});
test('I2 interval (M37): 9007199254740992 is excluded:interval, 9007199254740991 is accepted', async () => {
 status(await one({ body: T('2025-05-01T00:00Z') + ',9007199254740992,x\n' }), 'A', '2025-05', 'excluded:interval');
 status(await one({ body: T('2025-05-01T00:00Z') + ',9007199254740991,x\n' }), 'A', '2025-05', 'verified_nonempty');
});
test('I2 month (M38): the first millisecond of the next month is outside the file month', async () => {
 status(await one({ body: T('2025-06-01T00:00Z') + ',8,x\n' }), 'A', '2025-05', 'excluded:month');
});

// Definitions, D2 and O5.
test('O5/E1 (M24): a row without predecessor that scheduleClass(null, r) puts off grid has class off_grid', async () => {
 const r = await one({ body: csv(['2025-05-03T01:00Z', 8]) });
 assert.equal(text(r, 'pairs.csv'), PAIRS + 'A,1,,,' + T('2025-05-03T01:00Z') + ',8,,off_grid,era2,false,false,\n');
});
test('Definitions (M26): r.t exactly 2025-09-01T00:00:00Z is era3', async () => {
 const r = await one({ body: csv(['2025-09-01T00:00Z', 8]) }, '2025-09');
 assert.equal(text(r, 'pairs.csv'), PAIRS + 'A,1,,,' + T('2025-09-01T00:00Z') + ',8,,unclassified,era3,false,false,\n');
});
test('Definitions and D2 (M40, M41): a pair with r.t exactly W is eligible; a run starting at W after an April row is entry observed', async () => {
 const [a, b, c, d] = ['2025-04-30T16:00Z', '2025-05-01T00:00Z', '2025-05-01T01:00Z', '2025-05-01T08:00Z'].map(T);
 const r = await run(sources([{ symbol: 'A', month: '2025-04', body: csv(['2025-04-30T16:00Z', 8]) }, { symbol: 'A', month: '2025-05', body: csv(['2025-05-01T00:00Z', 1], ['2025-05-01T01:00Z', 1], ['2025-05-01T08:00Z', 8]) }]));
 assert.equal(text(r, 'pairs.csv'), PAIRS + 'A,1,' + a + ',8,' + b + ',1,8,interval_change,era1,false,false,A#1:entry_outer\nA,1,' + b + ',1,' + c + ',1,1,regular,era1,false,false,A#1:entry_inner+exit_inner\nA,1,' + c + ',1,' + d + ',8,7,unexplained_change,era1,false,false,A#1:exit_outer\n');
 const ep = (part, t, h) => 'A#1,A,1,' + part + ',' + t + ',' + h + ',observed\n';
 assert.equal(text(r, 'episodes.csv'), 'episode,symbol,segment,part,calc_time,funding_interval_hours,status\n' + ep('entry', a, 8) + ep('entry', b, 1) + ep('entry', c, 1) + ep('exit', b, 1) + ep('exit', c, 1) + ep('exit', d, 8));
});

// O1, O2 and D5 windows and ids.
test('O1 (M30, M31): entry window holds 3 rows before the run and the first 3 of n=4 run rows; exit the last 3 and the row after', async () => {
 const rows = [['2025-05-02T00:00Z', 8], ['2025-05-02T08:00Z', 8], ['2025-05-02T16:00Z', 8], ['2025-05-03T00:00Z', 8], ['2025-05-03T08:00Z', 1], ['2025-05-03T09:00Z', 1], ['2025-05-03T10:00Z', 1], ['2025-05-03T11:00Z', 1], ['2025-05-03T16:00Z', 8]];
 const r = await one({ body: csv(...rows) });
 const ep = (part, i) => 'A#1,A,1,' + part + ',' + T(rows[i][0]) + ',' + rows[i][1] + ',observed\n';
 assert.equal(text(r, 'episodes.csv'), 'episode,symbol,segment,part,calc_time,funding_interval_hours,status\n' + [1, 2, 3, 4, 5, 6].map(i => ep('entry', i)).join('') + [5, 6, 7, 8].map(i => ep('exit', i)).join(''));
});
test('O2 (M32): an isolated candidate lists up to 3 rows before and after it', async () => {
 const rows = [['2025-05-02T00:00Z', 8], ['2025-05-02T08:00Z', 8], ['2025-05-02T16:00Z', 8], ['2025-05-03T00:00Z', 8], ['2025-05-03T08:00Z', 1], ['2025-05-03T16:00Z', 8], ['2025-05-04T00:00Z', 8], ['2025-05-04T08:00Z', 8], ['2025-05-04T16:00Z', 8]];
 const r = await one({ body: csv(...rows) }), id = 'A@' + T('2025-05-03T08:00Z');
 assert.equal(text(r, 'label1_outside.csv'), 'candidate,symbol,segment,calc_time,funding_interval_hours\n' + [1, 2, 3, 4, 5, 6, 7].map(i => id + ',A,1,' + T(rows[i][0]) + ',' + rows[i][1] + '\n').join(''));
});
test('D5 (M33): run ids come before isolated ids in one roles field', async () => {
 const r = await one({ body: csv(['2025-05-03T00:00Z', 8], ['2025-05-03T08:00Z', 1], ['2025-05-03T16:00Z', 1], ['2025-05-03T17:00Z', 1], ['2025-05-04T00:00Z', 8]) });
 const x = T('2025-05-03T08:00Z');
 assert.ok(text(r, 'pairs.csv').includes('\nA,1,' + x + ',1,' + T('2025-05-03T16:00Z') + ',1,8,unexplained_gap,era2,false,false,A#1:entry_outer;A@' + x + ':isolated_out\n'));
});

// O13, O10.
test('O13 (M23): P0 reasons in O13 order, not_final_verified before e4_hourly_related', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-05', body: csv(['2025-05-03T00:00:15Z', 3], ['2025-05-03T08:00:15Z', 1], ['2025-05-03T09:00:15Z', 1], ['2025-05-03T12:00Z', 4], ['2025-05-03T16:00:15Z', 4]) }, { symbol: 'A', month: '2025-06', sideResponse: 503 }]));
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,not_final_verified\nscript,P0,e4_hourly_related\n');
});
test('O10 (M28): calc_time - t of 14,999 ms is not listed', async () => {
 assert.equal(text(await one({ body: csv(['2025-05-03T00:00:14.999Z', 8]) }), 'e4.csv'), 'symbol,calc_time,funding_interval_hours,hourly_related\n');
});
test('O10 (M29): h = 2 is inside {1,2,4,8} and not listed', async () => {
 assert.equal(text(await one({ body: csv(['2025-05-03T00:00Z', 2]) }), 'e4.csv'), 'symbol,calc_time,funding_interval_hours,hourly_related\n');
});

// O7, F6, O6.
test('O7 (M34): every 50th frozen key of months 2025-04 to 2025-09 is selected, starting with the first', async () => {
 const entries = [];
 for (let s = 1; s <= 9; s++) for (const m of ['04', '05', '06', '07', '08', '09']) entries.push({ symbol: 'S' + s, month: '2025-' + m, zip: zip('S' + s + '-fundingRate-2025-' + m + '.csv', csv(['2025-' + m + '-01T00:00Z', 8])) });
 const r = await run(sources(entries)), pick = i => key(entries[i].symbol, entries[i].month) + ',verified_nonempty,' + digest(entries[i].zip) + '\n';
 assert.equal(text(r, 'fixtures/fixtures.csv'), 'key,status,zip_sha256\n' + pick(0) + pick(50) + 'TREEUSDT/TREEUSDT-fundingRate-2025-08.zip,not_listed,\nTREEUSDT/TREEUSDT-fundingRate-2025-09.zip,not_listed,\n');
 assert.ok(r.files['fixtures/S9-fundingRate-2025-06.zip'].equals(entries[50].zip));
});
test('F6 (M39): more than 10,000 frozen zip keys stops the run before any source object is fetched', async () => {
 const routes = new Map(), syms = Array.from({ length: 1429 }, (_, i) => 'K' + String(i).padStart(4, '0'));
 routes.set(listPath(root), page(syms.map(s => root + s + '/')));
 for (const s of syms) routes.set(listPath(root + s + '/'), page([], ['04', '05', '06', '07', '08', '09', '10'].map(m => root + key(s, '2025-' + m))));
 // Any source fetch aborts at once, so a missing bound fails this assertion quickly instead of fetching 10,003 keys.
 const original = globalThis.fetch;
 globalThis.fetch = (url, ...rest) => String(url).includes('/download/') ? Promise.reject(new Abort('source_fetched')) : original(url, ...rest);
 let r;
 try { r = await run(routes); } finally { globalThis.fetch = original; }
 assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid keys\n'); assert.deepEqual(r.names, ['out0.invalid']);
 assert.equal(r.requests.length, 1430); assert.ok(r.requests.every(p => p.startsWith('/list?')));
});
test('O6 and S1 (M53): noncanonical_names counts object names in the root listing', async () => {
 const r = await run(new Map([[listPath(root), page([root + 'A/'], [root + 'index.html'])], [listPath(root + 'A/'), page()]]));
 assert.match(text(r, 'summary.txt'), /\nnoncanonical_names 1\n/);
});
