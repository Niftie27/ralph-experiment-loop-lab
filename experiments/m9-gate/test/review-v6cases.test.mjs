// Review harness s54/v6cases.mjs as committed tests (m9 fix batch): its five I1 cases on a synthetic non-ASCII member, driven
// through m9-scan.mjs, with the v6.2 I1 status (C34; D-01 clarification: non-ASCII name 0 or 0x0800 equal in both headers).
import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync, crc32 } from 'node:zlib';
import { sources, run, status } from './support.mjs';

const sym = '币安USDT', base = sym + '-fundingRate-2025-05.zip';
const body = Buffer.from('calc_time,funding_interval_hours,last_funding_rate\n' + Date.UTC(2025, 4, 1) + ',8,x\n');
function z(name, cf, lf) { const n = Buffer.from(name), d = deflateRawSync(body), L = Buffer.alloc(30), C = Buffer.alloc(46), E = Buffer.alloc(22);
 L.writeUInt32LE(0x04034b50); L.writeUInt16LE(lf, 6); L.writeUInt16LE(8, 8); L.writeUInt32LE(crc32(body), 14); L.writeUInt32LE(d.length, 18); L.writeUInt32LE(body.length, 22); L.writeUInt16LE(n.length, 26);
 C.writeUInt32LE(0x02014b50); C.writeUInt16LE(cf, 8); C.writeUInt16LE(8, 10); C.writeUInt32LE(crc32(body), 16); C.writeUInt32LE(d.length, 20); C.writeUInt32LE(body.length, 24); C.writeUInt16LE(n.length, 28);
 E.writeUInt32LE(0x06054b50); E.writeUInt16LE(1, 8); E.writeUInt16LE(1, 10); E.writeUInt32LE(46 + n.length, 12); E.writeUInt32LE(30 + n.length + d.length, 16); return Buffer.concat([L, n, d, C, n, E]); }
const csv = base.replace('.zip', '.csv');
for (const [id, name, cf, lf, want] of [['nonascii 0x0800 both', csv, 0x800, 0x800, 'verified_nonempty'], ['nonascii 0', csv, 0, 0, 'verified_nonempty'],
 ['nonascii 0x0800 central only', csv, 0x800, 0, 'excluded:member'], ['nonascii 0x0808', csv, 0x808, 0x808, 'excluded:member'],
 ['ascii-name 0x0800 (wrong name)', 'ABC-fundingRate-2025-05.csv', 0x800, 0x800, 'excluded:member']])
 test('v6cases I1 ' + id + ': ' + want, async () => {
  const r = await run(sources([{ symbol: sym, month: '2025-05', zip: z(name, cf, lf) }]));
  assert.equal(r.code, 0); status(r, sym, '2025-05', want);
 });
