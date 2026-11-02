// m9 review probe (integrity): I1 sidecar form, archive central directory, I2 header line. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, status, text, key, zip, csv, sidecar } from './support.mjs';

const k = key('A', '2025-05'), NAME = 'A-fundingRate-2025-05.csv';
const noOutputRows = r => { assert.equal(text(r, 'timing.csv'), 'symbol,segment,calc_time,funding_interval_hours\n'); assert.ok(!Object.keys(r.files).some(p => p.startsWith('fixtures/A-'))); };
// I1 (checksum): exactly 64 lowercase hex digits; a byte with the high bit set is no hex digit, even if it maps to one with the bit cleared.
for (const pos of [0, 37, 63]) test('INT-1 I1 checksum: hex digit ' + pos + ' with bit 7 set (e.g. 0xB0 for "0") is excluded:checksum', async () => {
 const z = zip(NAME, csv(['2025-05-01T00:00Z', 8])), sc = Buffer.from(sidecar(k, z));
 sc[pos] |= 0x80;
 const r = await run(sources([{ symbol: 'A', month: '2025-05', zip: z, sidecar: sc }]));
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'excluded:checksum'); noOutputRows(r);
});
// I1 (archive): the central directory consists of exactly the stated records "with no other bytes".
test('INT-2 I1 archive: one stray byte between the central record and the end record (sizes consistent) is excluded:archive', async () => {
 const z0 = zip(NAME, csv(['2025-05-01T00:00Z', 8])), e = z0.length - 22;
 const z = Buffer.concat([z0.subarray(0, e), Buffer.from([0]), z0.subarray(e)]);
 z.writeUInt32LE(z.readUInt32LE(z.length - 10) + 1, z.length - 10);
 const r = await run(sources([{ symbol: 'A', month: '2025-05', zip: z }]));
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'excluded:archive'); noOutputRows(r);
});
// I2: only line 1 can be the header; the same text on a later line is a data row and fails routing.
test('INT-3 I2: the header text on line 3 is a data row and fails routing', async () => {
 const body = csv(['2025-05-01T00:00Z', 8]) + 'calc_time,funding_interval_hours,last_funding_rate\n';
 const r = await run(sources([{ symbol: 'A', month: '2025-05', body }]));
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'excluded:routing'); noOutputRows(r);
});
test('INT-4 I2: a header on line 2 after a data row fails routing', async () => {
 const body = String(Date.parse('2025-05-01T00:00Z')) + ',8,x\ncalc_time,funding_interval_hours,last_funding_rate\n';
 const r = await run(sources([{ symbol: 'A', month: '2025-05', body }]));
 status(r, 'A', '2025-05', 'excluded:routing');
});
