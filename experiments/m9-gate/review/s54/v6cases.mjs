// v6-only I1 cases on a synthetic non-ASCII member (indep parser; m9 d73aba1 is v5 code).
import { deflateRawSync, crc32 } from 'node:zlib';
import { check, hex } from './indep.mjs';
const sym = '\u5e01\u5b89USDT', key = sym + '/' + sym + '-fundingRate-2025-05.zip', base = key.split('/')[1];
const body = Buffer.from('calc_time,funding_interval_hours,last_funding_rate\n' + Date.UTC(2025,4,1) + ',8,x\n');
function z(name, cf, lf) { const n = Buffer.from(name), d = deflateRawSync(body), L = Buffer.alloc(30), C = Buffer.alloc(46), E = Buffer.alloc(22);
  L.writeUInt32LE(0x04034b50); L.writeUInt16LE(lf, 6); L.writeUInt16LE(8, 8); L.writeUInt32LE(crc32(body), 14); L.writeUInt32LE(d.length, 18); L.writeUInt32LE(body.length, 22); L.writeUInt16LE(n.length, 26);
  C.writeUInt32LE(0x02014b50); C.writeUInt16LE(cf, 8); C.writeUInt16LE(8, 10); C.writeUInt32LE(crc32(body), 16); C.writeUInt32LE(d.length, 20); C.writeUInt32LE(body.length, 24); C.writeUInt16LE(n.length, 28);
  E.writeUInt32LE(0x06054b50); E.writeUInt16LE(1, 8); E.writeUInt16LE(1, 10); E.writeUInt32LE(46 + n.length, 12); E.writeUInt32LE(30 + n.length + d.length, 16); return Buffer.concat([L, n, d, C, n, E]); }
const csv = base.replace('.zip', '.csv'), cases = [['nonascii 0x0800 both', csv, 0x800, 0x800, 'verified_nonempty', 'excluded:member'], ['nonascii 0', csv, 0, 0, 'verified_nonempty', 'excluded:member'],
  ['nonascii 0x0800 central only', csv, 0x800, 0, 'excluded:member', 'excluded:member'], ['nonascii 0x0808', csv, 0x808, 0x808, 'excluded:member', 'excluded:member'],
  ['ascii-name 0x0800 (wrong name)', 'ABC-fundingRate-2025-05.csv', 0x800, 0x800, 'excluded:member', 'excluded:member']];
let bad = 0; for (const [id, n, cf, lf, w6, w5] of cases) { const zz = z(n, cf, lf), sc = hex(zz) + '  ' + base + '\n'; const a = check(key, sc, zz, 'v6').status, b = check(key, sc, zz, 'v5').status; if (a !== w6 || b !== w5) { bad++; console.log('MISMATCH', id, a, b); } }
console.log('v6 cases', cases.length, 'mismatches', bad);
