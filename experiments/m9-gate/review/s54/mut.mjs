// Fixture mutations (session 54): each case changes one property of one real 4a fixture; expected status from spec v5 text.
import { readFileSync } from 'node:fs';
import { inflateRawSync, deflateRawSync, crc32 } from 'node:zlib';
import { check, hex } from './indep.mjs';
const REPO = process.env.REPO, P = REPO + '/experiments/m9-gate/probe-4a/';
const { run, sources, text } = await import(REPO + '/experiments/m9-gate/test/support.mjs');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, FIX = process.env.FIX ? process.env.FIX.split(',') : null, M9 = process.env.M9 !== '0';
const keys = readFileSync(P + 'keys.csv', 'utf8').trim().split('\n').slice(1).map(l => l.split(',')).filter(f => f[0] && f[2] !== '2025-10');
// parse a single-entry zip into parts (own code)
function parts(z) {
  const e = z.length - 22, cd = z.readUInt32LE(e + 16), lo = z.readUInt32LE(cd + 42), nl = z.readUInt16LE(lo + 26), lx = z.readUInt16LE(lo + 28);
  return { e, cd, lo, nl, lx, name: z.subarray(cd + 46, cd + 46 + z.readUInt16LE(cd + 28)), data: z.subarray(lo + 30 + nl + lx, lo + 30 + nl + lx + z.readUInt32LE(cd + 20)) };
}
// rebuild a single-entry zip from a member body with options
function build(name, body, o = {}) {
  const n = Buffer.from(name), d = o.data ?? deflateRawSync(body), lx = o.localExtra ?? Buffer.alloc(0), cx = o.cdExtra ?? Buffer.alloc(0), cc = o.cdComment ?? Buffer.alloc(0);
  const L = Buffer.alloc(30), C = Buffer.alloc(46), E = Buffer.alloc(22);
  L.writeUInt32LE(0x04034b50, 0); L.writeUInt16LE(20, 4); L.writeUInt16LE(o.lflags ?? o.flags ?? 0, 6); L.writeUInt16LE(o.lmethod ?? o.method ?? 8, 8); L.writeUInt32LE(crc32(body), 14); L.writeUInt32LE(d.length, 18); L.writeUInt32LE(body.length, 22); L.writeUInt16LE(n.length, 26); L.writeUInt16LE(lx.length, 28);
  C.writeUInt32LE(0x02014b50, 0); C.writeUInt16LE(20, 4); C.writeUInt16LE(20, 6); C.writeUInt16LE(o.flags ?? 0, 8); C.writeUInt16LE(o.method ?? 8, 10); C.writeUInt32LE(crc32(body), 16); C.writeUInt32LE(d.length, 20); C.writeUInt32LE(body.length, 24); C.writeUInt16LE(n.length, 28); C.writeUInt16LE(cx.length, 30); C.writeUInt16LE(cc.length, 32);
  const local = Buffer.concat([L, n, lx, d]), cdr = Buffer.concat([C, n, cx, cc]);
  E.writeUInt32LE(0x06054b50, 0); E.writeUInt16LE(1, 8); E.writeUInt16LE(1, 10); E.writeUInt32LE(cdr.length, 12); E.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, cdr, E]);
}
const set16 = (z, at, v) => { z = Buffer.from(z); z.writeUInt16LE(v, at); return z; }, set32 = (z, at, v) => { z = Buffer.from(z); z.writeUInt32LE(v >>> 0, at); return z; };
const csvCase = (f, want) => ({ csv: f, want });
// cases: [id, fn(zip, base, body, p) -> {zip?, sidecar?} , expected]
const C = {
  ok: [z => ({ zip: z }), 'verified_nonempty'],
  s_upper: [(z, b) => ({ zip: z, sidecar: hex(z).toUpperCase() + '  ' + b + '\n' }), 'excluded:checksum'],
  s_crlf: [(z, b) => ({ zip: z, sidecar: hex(z) + '  ' + b + '\r\n' }), 'excluded:checksum'],
  s_nolf: [(z, b) => ({ zip: z, sidecar: hex(z) + '  ' + b }), 'excluded:checksum'],
  s_onespace: [(z, b) => ({ zip: z, sidecar: hex(z) + ' ' + b + '\n' }), 'excluded:checksum'],
  s_twolf: [(z, b) => ({ zip: z, sidecar: hex(z) + '  ' + b + '\n\n' }), 'excluded:checksum'],
  s_name: [(z, b) => ({ zip: z, sidecar: hex(z) + '  ' + b.replace('.zip', '.ZIP') + '\n' }), 'excluded:checksum'],
  s_star: [(z, b) => ({ zip: z, sidecar: hex(z) + ' *' + b + '\n' }), 'excluded:checksum'],
  s_hash: [(z, b) => { const h = hex(z); return { zip: z, sidecar: (h[0] === '0' ? '1' : '0') + h.slice(1) + '  ' + b + '\n' }; }, 'excluded:hash'],
  a_trunc: [z => ({ zip: z.subarray(0, z.length - 1) }), 'excluded:archive'],
  a_disk: [(z, b, x, p) => ({ zip: set16(z, p.e + 4, 1) }), 'excluded:archive'],
  a_cddisk: [(z, b, x, p) => ({ zip: set16(z, p.e + 6, 1) }), 'excluded:archive'],
  a_ondisk: [(z, b, x, p) => ({ zip: set16(z, p.e + 8, 2) }), 'excluded:archive'],
  a_cdoff: [(z, b, x, p) => ({ zip: set32(z, p.e + 16, p.cd + 1) }), 'excluded:archive'],
  a_cdsize: [(z, b, x, p) => ({ zip: set32(z, p.e + 12, z.readUInt32LE(p.e + 12) - 1) }), 'excluded:archive'],
  a_zip64: [(z, b, x, p) => ({ zip: set16(set16(z, p.e + 8, 0xffff), p.e + 10, 0xffff) }), 'excluded:archive'],
  a_zip64size: [(z, b, x, p) => ({ zip: set32(z, p.cd + 20, 0xffffffff) }), 'excluded:archive'],
  a_cdsig: [(z, b, x, p) => ({ zip: set32(z, p.cd, 0x02014b51) }), 'excluded:archive'],
  a_garbage: [z => ({ zip: Buffer.concat([z, Buffer.from([0])]) }), 'excluded:archive'],
  a_comment: [(z, b, x, p) => ({ zip: Buffer.concat([set16(z, p.e + 20, 3), Buffer.from('abc')]) }), 'verified_nonempty'],
  m_utf8flag: [(z, b, x, p) => ({ zip: set16(set16(z, p.cd + 8, 0x0800), p.lo + 6, 0x0800) }), 'excluded:member'],
  m_flag8: [(z, b, x, p) => ({ zip: set16(set16(z, p.cd + 8, 0x0008), p.lo + 6, 0x0008) }), 'excluded:member'],
  m_flag1: [(z, b, x, p) => ({ zip: set16(set16(z, p.cd + 8, 0x0001), p.lo + 6, 0x0001) }), 'excluded:member'],
  m_lflag: [(z, b, x, p) => ({ zip: set16(z, p.lo + 6, 0x0008) }), 'excluded:member'],
  m_cflag: [(z, b, x, p) => ({ zip: set16(z, p.cd + 8, 0x0008) }), 'excluded:member'],
  m_method0: [(z, b, x, p) => ({ zip: set16(set16(z, p.cd + 10, 0), p.lo + 8, 0) }), 'excluded:member'],
  m_lmethod: [(z, b, x, p) => ({ zip: set16(z, p.lo + 8, 0) }), 'excluded:member'],
  m_name: [(z, b, x, p) => { z = Buffer.from(z); z[p.cd + 46 + p.name.length - 1] = 0x43; z[p.lo + 30 + p.nl - 1] = 0x43; return { zip: z }; }, 'excluded:member'],
  m_lname: [(z, b, x, p) => { z = Buffer.from(z); z[p.lo + 30 + p.nl - 1] = 0x43; return { zip: z }; }, 'excluded:member'],
  m_cddiskstart: [(z, b, x, p) => ({ zip: set16(z, p.cd + 34, 1) }), 'verified_nonempty'],
  m_two: [(z, b, x, p) => { const cdr = z.subarray(p.cd, p.e), E = Buffer.from(z.subarray(p.e)); E.writeUInt16LE(2, 8); E.writeUInt16LE(2, 10); E.writeUInt32LE(cdr.length * 2, 12); return { zip: Buffer.concat([z.subarray(0, p.cd), cdr, cdr, E]) }; }, 'excluded:member'],
  m_dataend: [(z, b, x, p) => ({ zip: set32(set32(z, p.cd + 20, p.data.length + 1), p.lo + 18, p.data.length + 1) }), 'excluded:member'],
  m_lofs: [(z, b, x, p) => ({ zip: set32(z, p.cd + 42, 1) }), 'excluded:member'],
  m_lextra: [(z, b, body, p) => ({ zip: build(p.name, body, { localExtra: Buffer.from([0x99, 0x99, 0, 0]) }) }), 'verified_nonempty'],
  m_cdextra: [(z, b, body, p) => ({ zip: build(p.name, body, { cdExtra: Buffer.from([0x99, 0x99, 0, 0]), cdComment: Buffer.from('c') }) }), 'verified_nonempty'],
  c_crc: [(z, b, x, p) => { const v = z.readUInt32LE(p.cd + 16) ^ 1; return { zip: set32(set32(z, p.cd + 16, v), p.lo + 14, v) }; }, 'excluded:crc'],
  c_usize: [(z, b, x, p) => ({ zip: set32(z, p.cd + 24, z.readUInt32LE(p.cd + 24) + 1) }), 'excluded:crc'],
  c_stream: [(z, b, x, p) => { z = Buffer.from(z); z[p.lo + 30 + p.nl + p.lx] ^= 0xff; return { zip: z }; }, 'excluded:crc'],
};
// I2 cases on the inflated member (rebuilt with correct headers)
const lines = s => s.split('\n');
const G = {
  g_bom: [s => '\ufeff' + s, 'excluded:routing'],
  g_crlf: [s => s.replaceAll('\n', '\r\n'), 'excluded:routing'],
  g_noheader: [s => lines(s).slice(1).join('\n'), 'verified_nonempty'],
  g_nolf: [s => s.replace(/\n$/, ''), 'excluded:framing'],
  g_four: [s => { const l = lines(s); l[2] += ',x'; return l.join('\n'); }, 'excluded:fields'],
  g_two: [s => { const l = lines(s); l[2] = l[2].split(',').slice(0, 2).join(','); return l.join('\n'); }, 'excluded:fields'],
  g_swap: [s => { const l = lines(s); [l[2], l[3]] = [l[3], l[2]]; return l.join('\n'); }, 'excluded:order'],
  g_dup: [s => { const l = lines(s); l.splice(3, 0, l[2]); return l.join('\n'); }, 'excluded:order'],
  g_hour: [s => { const l = lines(s), f = l[2].split(','); l.splice(3, 0, (+f[0] + 60000) + ',' + f[1] + ',' + f[2]); return l.join('\n'); }, 'excluded:hour'],
  g_h0: [s => { const l = lines(s), f = l[2].split(','); f[1] = '0'; l[2] = f.join(','); return l.join('\n'); }, 'excluded:interval'],
  g_h08: [s => { const l = lines(s), f = l[2].split(','); f[1] = '0' + f[1]; l[2] = f.join(','); return l.join('\n'); }, 'excluded:interval'],
  g_hbig: [s => { const l = lines(s), f = l[2].split(','); f[1] = '9007199254740992'; l[2] = f.join(','); return l.join('\n'); }, 'excluded:interval'],
  g_hmax: [s => { const l = lines(s), f = l[2].split(','); f[1] = '9007199254740991'; l[2] = f.join(','); return l.join('\n'); }, 'verified_nonempty'],
  g_hempty: [s => { const l = lines(s), f = l[2].split(','); f[1] = ''; l[2] = f.join(','); return l.join('\n'); }, 'excluded:interval'],
  g_t12: [s => { const l = lines(s); l[2] = l[2].slice(1); return l.join('\n'); }, 'excluded:routing'],
  g_t14: [s => { const l = lines(s); l[2] = '0' + l[2]; return l.join('\n'); }, 'excluded:routing'],
  g_before: [s => { const l = lines(s), f = l[1].split(','); l.splice(1, 0, (+f[0] - 40 * 86400000) + ',8,x'); return l.join('\n'); }, 'excluded:month'],
  g_sealed: [s => s + String(Date.UTC(2025, 9, 17)) + ',8,x\n', 'excluded:month'],
  g_emptyline: [s => { const l = lines(s); l.splice(3, 0, ''); return l.join('\n'); }, 'excluded:routing'],
  g_third: [s => { const l = lines(s), f = l[2].split(','); f[2] = ''; l[2] = f.join(','); return l.join('\n'); }, 'verified_nonempty'],
  g_onlyheader: [s => lines(s)[0] + '\n', 'verified_empty'],
  g_trailing: [s => s + '\n', 'excluded:routing'],
};
let n = 0, bad = [], t0 = Date.now();
for (const [idx, sym, month, key] of keys) {
  if (FIX && !FIX.includes(idx)) continue;
  const z0 = readFileSync(P + 'fixtures/' + idx + '.zip'), base = key.split('/').at(-1), p = parts(z0), body = inflateRawSync(p.data);
  const cases = [...Object.entries(C).map(([id, [f, want]]) => [id, () => f(z0, base, body, p), want]),
    ...Object.entries(G).map(([id, [f, want]]) => [id, () => ({ zip: build(p.name, Buffer.from(f(body.toString('latin1')), 'latin1')) }), want])];
  for (let [id, make, want] of cases) {
    if (ONLY && !ONLY.includes(id)) continue;
    const m = make(), sc = m.sidecar ?? hex(m.zip) + '  ' + base + '\n';
    const RULE = process.env.RULE || 'v5', ind = check(key, Buffer.from(sc), m.zip, RULE).status;
    if (RULE === 'v6' && id === 'm_cddiskstart') want = 'excluded:archive';
    let m9 = '-';
    if (M9) { const r = await run(sources([{ symbol: sym, month, zip: m.zip, sidecar: sc }])); m9 = text(r, 'manifest.csv').split('\n').find(l => l.startsWith(sym + ',' + month + ',')).split(',')[2]; }
    n++; if (ind !== want || (M9 && m9 !== want)) bad.push([idx, id, 'want', want, 'indep', ind, 'm9', m9].join(' '));
  }
}
console.log('cases', n, 'mismatches', bad.length, 'seconds', ((Date.now() - t0) / 1000).toFixed(1));
const agg = {}; for (const b of bad) { const k = b.split(' ').slice(1).join(' '); agg[k] = (agg[k] || 0) + 1; }
for (const [k, v] of Object.entries(agg)) console.log(v + 'x', k);
