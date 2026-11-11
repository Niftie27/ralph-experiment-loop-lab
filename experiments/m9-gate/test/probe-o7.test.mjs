// m9 review probe (O7): fixture bytes only for selected keys, exclusion picks never from 2025-10. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, key, zip, csv, sidecar, digest } from './support.mjs';

test('O7-1 O7: bytes only for the selected verified key; excluded picks are status records; a 2025-10 exclusion is never selected', async () => {
 const z4 = zip('A-fundingRate-2025-04.csv', csv(['2025-04-01T00:00Z', 8]));
 const z10 = zip('A-fundingRate-2025-10.csv', csv(['2025-10-01T00:00Z', 8]));
 z10.writeUInt32LE((z10.readUInt32LE(z10.readUInt32LE(z10.length - 6) + 16) ^ 1) >>> 0, z10.readUInt32LE(z10.length - 6) + 16); // central CRC wrong
 const r = await run(sources([
  { symbol: 'A', month: '2025-04', zip: z4 },
  { symbol: 'A', month: '2025-05', body: csv(['2025-05-01T00:00Z', 8]) },
  { symbol: 'A', month: '2025-06', sidecar: '0'.repeat(63) + 'G  A-fundingRate-2025-06.zip\n' },
  { symbol: 'A', month: '2025-10', zip: z10 }]));
 assert.equal(r.code, 0);
 assert.match(text(r, 'manifest.csv'), /\nA,2025-10,excluded:crc,/);
 assert.deepEqual(Object.keys(r.files).filter(p => p.startsWith('fixtures/')).sort(), ['fixtures/A-fundingRate-2025-04.zip', 'fixtures/A-fundingRate-2025-04.zip.CHECKSUM', 'fixtures/fixtures.csv']);
 assert.ok(r.files['fixtures/A-fundingRate-2025-04.zip'].equals(z4));
 assert.equal(text(r, 'fixtures/fixtures.csv'), 'key,status,zip_sha256\n' + key('A', '2025-04') + ',verified_nonempty,' + digest(z4) + '\n' + key('A', '2025-06') + ',excluded:checksum,\nTREEUSDT/TREEUSDT-fundingRate-2025-08.zip,not_listed,\nTREEUSDT/TREEUSDT-fundingRate-2025-09.zip,not_listed,\n');
});
