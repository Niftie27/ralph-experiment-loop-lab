// D-02 probe: v6.2 F6 (C39, C43) requires the single reason resource_2025_10 for any resource abort while a 2025-10 file is processed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, zip, csv, time } from './support.mjs';
import { LIMITS, Budget } from '../m9-scan.mjs';

// Marker file and stdout carry only the reason (D-02 clarification).
const only = (r, reason) => { assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid ' + reason + '\n'); assert.deepEqual(r.names, ['out0.invalid']); assert.deepEqual(r.stdout, ['invalid ' + reason + '\n']); };
test('D-02: a 65537-byte sealed line in a 2025-10 file aborts with the single reason resource_2025_10 (marker and stdout)', async () => {
 const body = time('2025-10-17Z') + ',' + 'x'.repeat(65537 - 14) + '\n';
 const r = await run(sources([{ symbol: 'A', month: '2025-10', body }]));
 only(r, 'resource_2025_10');
});
test('D-02: a 2025-10 zip declaring a member over the bound aborts with resource_2025_10', async () => {
 const z = zip('A-fundingRate-2025-10.csv', csv(['2025-10-01T00:00Z', 8]));
 z.writeUInt32LE(LIMITS.member + 1, z.readUInt32LE(z.length - 6) + 24);
 const r = await run(sources([{ symbol: 'A', month: '2025-10', zip: z }]));
 only(r, 'resource_2025_10');
});
// D-02 clarification: every bound hit while a 2025-10 key's sidecar or zip is fetched, including the total.
const big = n => ({ stream: res => { res.writeHead(200); res.end(Buffer.alloc(n, 120)); } });
for (const [month, reason] of [['2025-10', 'resource_2025_10'], ['2025-05', 'sidecar']]) test('D-02: a 200 sidecar body over the sidecar bound in a ' + month + ' file aborts with ' + reason, async () => {
 only(await run(sources([{ symbol: 'A', month, sideResponse: big(LIMITS.sidecar + 1) }])), reason);
});
for (const [month, reason] of [['2025-10', 'resource_2025_10'], ['2025-05', 'total']]) test('D-02: the total received-byte limit hit while a ' + month + ' sidecar is fetched aborts with ' + reason, async () => {
 const original = Budget.prototype.receive;
 Budget.prototype.receive = function (kind, ...rest) { if (kind !== 'listing') this.total = LIMITS.total; return original.call(this, kind, ...rest); };
 try { only(await run(sources([{ symbol: 'A', month }])), reason); }
 finally { Budget.prototype.receive = original; }
});
