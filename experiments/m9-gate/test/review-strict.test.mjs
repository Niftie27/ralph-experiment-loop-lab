// Review harness s54/strict.mjs as committed tests (m9 fix batch): strict mock from the real 4a pages (real recorded request URLs ->
// real bytes; synthetic only where 4a has no bytes: 974 symbol listings and 4 October zips). Expected values come from Claude's
// independent parser review/s54/indep.mjs (imported read-only) with its rule 'v6', which for these inputs equals spec v6.2 I1/S1;
// the script's default RULE=v5 is not used because v6.2 accepts the October 0x0800 non-ASCII member (C34).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import { ROOT, s1, listing, freeze, check, hex, MONTHS } from '../review/s54/indep.mjs';
import { run, text } from './support.mjs';

const P = new URL('../probe-4a/', import.meta.url), read = f => readFileSync(new URL(f, P));
const LIST = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision', DL = 'https://data.binance.vision/' + ROOT;
const req = read('requests.csv').toString('utf8').trim().split('\n').slice(1).map(l => { const f = l.split(','); return { kind: f[1], http: f[3], url: f.slice(6).join(',') }; });
const keys = read('keys.csv').toString('utf8').trim().split('\n').slice(1).map(l => l.split(',')).filter(f => f[0]);
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function zip(name, body, flags) {
 const n = Buffer.from(name, 'utf8'), d = deflateRawSync(body), L = Buffer.alloc(30), C = Buffer.alloc(46), E = Buffer.alloc(22);
 L.writeUInt32LE(0x04034b50, 0); L.writeUInt16LE(20, 4); L.writeUInt16LE(flags, 6); L.writeUInt16LE(8, 8); L.writeUInt32LE(crc32(body), 14); L.writeUInt32LE(d.length, 18); L.writeUInt32LE(body.length, 22); L.writeUInt16LE(n.length, 26);
 C.writeUInt32LE(0x02014b50, 0); C.writeUInt16LE(20, 4); C.writeUInt16LE(20, 6); C.writeUInt16LE(flags, 8); C.writeUInt16LE(8, 10); C.writeUInt32LE(crc32(body), 16); C.writeUInt32LE(d.length, 20); C.writeUInt32LE(body.length, 24); C.writeUInt16LE(n.length, 28);
 E.writeUInt32LE(0x06054b50, 0); E.writeUInt16LE(1, 8); E.writeUInt16LE(1, 10); E.writeUInt32LE(46 + n.length, 12); E.writeUInt32LE(30 + n.length + d.length, 16);
 return Buffer.concat([L, n, d, C, n, E]);
}
function routesFor(rootPages) {
 const routes = new Map();
 const lists = req.filter(r => r.kind === 'list' && !r.url.includes('max-keys'));
 const files = ['root-default-001.xml', ...readdirSync(new URL('listing/', P)).filter(f => f.startsWith('sym-')).sort()];
 assert.equal(lists.length, files.length);
 lists.forEach((r, i) => { assert.equal(r.http, '200'); routes.set('/list' + r.url.slice(LIST.length), read('listing/' + files[i])); });
 for (const [idx, , , key] of keys) {
  const u = DL + s1(key, true), zr = req.find(r => r.url === u), sr = req.find(r => r.url === u + '.CHECKSUM');
  assert.ok(sr && sr.http === '200', 'sidecar recorded for ' + idx);
  if (zr) { routes.set('/download/' + s1(key, true), read('fixtures/' + idx + '.zip')); routes.set('/download/' + s1(key, true) + '.CHECKSUM', read('fixtures/' + idx + '.zip.CHECKSUM')); }
 }
 if (rootPages === 'max100') {
  const m100 = req.filter(r => r.kind === 'list' && r.url.includes('max-keys=100'));
  assert.equal(m100.length, 10);
  m100.forEach((r, i) => routes.set('/list' + r.url.slice(LIST.length).replace('&max-keys=100', ''), read('listing/root-max100-' + String(i + 1).padStart(3, '0') + '.xml')));
 }
 for (const p of listing(read('listing/root-default-001.xml')).prefixes) {
  const path = '/list?delimiter=%2F&prefix=' + s1(p, false);
  if (routes.has(path) || ['BTCUSDT/', 'ETHUSDT/', 'SOLUSDT/', 'XRPUSDT/', 'DOGEUSDT/', 'HYPEUSDT/'].some(s => p === ROOT + s)) continue;
  routes.set(path, Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>data.binance.vision</Name><Prefix>' + esc(p) + '</Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><Delimiter>/</Delimiter><IsTruncated>false</IsTruncated></ListBucketResult>'));
 }
 for (const [, sym, month, key] of keys) if (month === '2025-10') {
  const rows = ['calc_time,funding_interval_hours,last_funding_rate'];
  for (let t = Date.UTC(2025, 9, 1); t <= Date.UTC(2025, 9, 17, 16); t += 8 * 3600000) rows.push(t + 5 + ',8,0.0001');
  const base = key.split('/').at(-1), z = zip(base.slice(0, -4) + '.csv', Buffer.from(rows.join('\n') + '\n'), /[^\x00-\x7f]/.test(sym) ? 0x0800 : 0);
  routes.set('/download/' + s1(key, true), z); routes.set('/download/' + s1(key, true) + '.CHECKSUM', hex(z) + '  ' + base + '\n');
 }
 return routes;
}
for (const rootPages of ['default', 'max100']) test('strict 4a mock (ROOTPAGES=' + rootPages + '): O8, O6 freeze counts, O4 and O0 equal the independent v6.2 parser; fixtures byte-equal', async () => {
 const routes = routesFor(rootPages);
 const ind = await freeze(async (prefix, marker) => { const r = routes.get('/list?delimiter=%2F&prefix=' + s1(prefix, false) + (marker === null ? '' : '&marker=' + s1(marker, false))); if (!r) throw new Error('indep: no route ' + prefix); return r; });
 const st = new Map();
 for (const k of ind.keys) { const p = '/download/' + s1(k, true); st.set(k, { ...check(k, routes.get(p + '.CHECKSUM'), routes.get(p), 'v6'), hash: hex(routes.get(p)), size: routes.get(p).length }); }
 const r = await run(routes);
 assert.equal(r.code, 0);
 assert.equal(text(r, 'symbols.txt'), ind.symbols.join('\n') + '\n');
 assert.equal(text(r, 'keys.txt'), ind.keys.join('\n') + '\n');
 const sum = Object.fromEntries(text(r, 'summary.txt').trim().split('\n').map(l => [l.slice(0, l.indexOf(' ')), l.slice(l.indexOf(' ') + 1)]));
 for (const [k, v] of Object.entries(ind.counts)) assert.equal(sum[k], String(v), k);
 assert.equal(sum.symbols_listed, String(ind.symbols.length)); assert.equal(sum.keys_frozen, String(ind.keys.length));
 const syms = [...new Set(ind.keys.map(k => k.split('/')[0]))].sort((x, y) => Buffer.compare(Buffer.from(x), Buffer.from(y)));
 assert.equal(sum.symbols_with_keys, String(syms.length));
 const o4 = [];
 for (const s of syms) for (const m of MONTHS) { const k = s + '/' + s + '-fundingRate-' + m + '.zip', x = st.get(k); o4.push([s, m, x ? x.status : 'not_listed', x ? x.hash : '', x && m !== '2025-10' ? x.size : ''].join(',')); }
 assert.equal(text(r, 'manifest.csv'), 'symbol,month,status,zip_sha256,zip_bytes\n' + o4.join('\n') + '\n');
 const o0 = text(r, 'timing.csv').trim().split('\n').slice(1).map(l => { const f = l.split(','); return [f[0], f[2], f[3]].join(','); });
 const exp0 = []; for (const k of ind.keys) { const x = st.get(k); if (x.status === 'verified_nonempty') for (const [t, h] of x.rows) exp0.push([k.split('/')[0], t, h].join(',')); }
 assert.deepEqual(o0, exp0);
 const fx = Object.keys(r.files).filter(f => f.startsWith('fixtures/') && f !== 'fixtures/fixtures.csv');
 assert.ok(fx.length > 0);
 for (const f of fx) { const k = ind.keys.find(k => k.endsWith('/' + f.slice(9).replace(/\.CHECKSUM$/, ''))); const path = '/download/' + s1(k, true) + (f.endsWith('.CHECKSUM') ? '.CHECKSUM' : ''); assert.ok(r.files[f].equals(Buffer.from(routes.get(path))), f); }
});
