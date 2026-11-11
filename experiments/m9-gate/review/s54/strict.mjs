// Strict mock from real 4a pages (session 54). Routes: real recorded request URLs (requests.csv, host stripped) -> real bytes;
// synthetic only where 4a has no bytes (974 symbol listings, 4 October zips). Anything else: 404 + recorded as unexpected.
import { readFileSync, readdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import assert from 'node:assert/strict';
import { ROOT, s1, listing, freeze, check, hex, MONTHS } from './indep.mjs';
const REPO = process.env.REPO, P = REPO + '/experiments/m9-gate/probe-4a/';
const { run, text } = await import(REPO + '/experiments/m9-gate/test/support.mjs');
const rule = process.env.RULE || 'v5';
const LIST = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision', DL = 'https://data.binance.vision/' + ROOT;
const req = readFileSync(P + 'requests.csv', 'utf8').trim().split('\n').slice(1).map(l => { const f = l.split(','); return { kind: f[1], http: f[3], url: f.slice(6).join(',') }; });
const routes = new Map(), real = new Map();
// listings: root (default page) and the 8 symbol pages, in recorded order
const lists = req.filter(r => r.kind === 'list' && !r.url.includes('max-keys'));
const files = ['root-default-001.xml', ...readdirSync(P + 'listing').filter(f => f.startsWith('sym-')).sort()];
assert.equal(lists.length, files.length);
lists.forEach((r, i) => { assert.equal(r.http, '200'); routes.set('/list' + r.url.slice(LIST.length), readFileSync(P + 'listing/' + files[i])); });
// downloads: the recorded zip/sidecar URLs -> fixture bytes by key index
const keys = readFileSync(P + 'keys.csv', 'utf8').trim().split('\n').slice(1).map(l => l.split(',')).filter(f => f[0]);
for (const [idx, , , key] of keys) {
  const u = DL + s1(key, true);
  const zr = req.find(r => r.url === u), sr = req.find(r => r.url === u + '.CHECKSUM');
  assert.ok(sr && sr.http === '200', 'sidecar recorded for ' + idx);
  if (zr) { routes.set('/download/' + s1(key, true), readFileSync(P + 'fixtures/' + idx + '.zip')); routes.set('/download/' + s1(key, true) + '.CHECKSUM', readFileSync(P + 'fixtures/' + idx + '.zip.CHECKSUM')); real.set(key, true); }
}
// variant: serve the 10 real max-keys=100 root pages to the default queries (real NextMarker chain); m9 sends no max-keys
if (process.env.ROOTPAGES === 'max100') {
  const m100 = req.filter(r => r.kind === 'list' && r.url.includes('max-keys=100'));
  assert.equal(m100.length, 10);
  m100.forEach((r, i) => routes.set('/list' + r.url.slice(LIST.length).replace('&max-keys=100', ''), readFileSync(P + 'listing/root-max100-' + String(i + 1).padStart(3, '0') + '.xml')));
}
// synthetic: empty real-format listing for every other symbol prefix in the real root page
const rootPage = listing(readFileSync(P + 'listing/root-default-001.xml'));
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let synthetic = 0;
for (const p of rootPage.prefixes) {
  const path = '/list?delimiter=%2F&prefix=' + s1(p, false);
  if (routes.has(path) || ['BTCUSDT/', 'ETHUSDT/', 'SOLUSDT/', 'XRPUSDT/', 'DOGEUSDT/', 'HYPEUSDT/'].some(s => p === ROOT + s)) continue;
  routes.set(path, Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>data.binance.vision</Name><Prefix>' + esc(p) + '</Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><Delimiter>/</Delimiter><IsTruncated>false</IsTruncated></ListBucketResult>'));
  synthetic++;
}
// synthetic October zips (no real October bytes exist in 4a; sealed). Own writer; 币安人生 gets flags 0x0800 as the bit-11 probe saw.
function zip(name, body, flags) {
  const n = Buffer.from(name, 'utf8'), d = deflateRawSync(body), L = Buffer.alloc(30), C = Buffer.alloc(46), E = Buffer.alloc(22);
  L.writeUInt32LE(0x04034b50, 0); L.writeUInt16LE(20, 4); L.writeUInt16LE(flags, 6); L.writeUInt16LE(8, 8); L.writeUInt32LE(crc32(body), 14); L.writeUInt32LE(d.length, 18); L.writeUInt32LE(body.length, 22); L.writeUInt16LE(n.length, 26);
  C.writeUInt32LE(0x02014b50, 0); C.writeUInt16LE(20, 4); C.writeUInt16LE(20, 6); C.writeUInt16LE(flags, 8); C.writeUInt16LE(8, 10); C.writeUInt32LE(crc32(body), 16); C.writeUInt32LE(d.length, 20); C.writeUInt32LE(body.length, 24); C.writeUInt16LE(n.length, 28);
  E.writeUInt32LE(0x06054b50, 0); E.writeUInt16LE(1, 8); E.writeUInt16LE(1, 10); E.writeUInt32LE(46 + n.length, 12); E.writeUInt32LE(30 + n.length + d.length, 16);
  return Buffer.concat([L, n, d, C, n, E]);
}
const oct = [];
for (const [idx, sym, month, key] of keys) if (month === '2025-10') {
  const rows = ['calc_time,funding_interval_hours,last_funding_rate'];
  for (let t = Date.UTC(2025, 9, 1); t <= Date.UTC(2025, 9, 17, 16); t += 8 * 3600000) rows.push(t + 5 + ',8,0.0001');
  const base = key.split('/').at(-1), z = zip(base.slice(0, -4) + '.csv', Buffer.from(rows.join('\n') + '\n'), /[^\x00-\x7f]/.test(sym) ? 0x0800 : 0);
  routes.set('/download/' + s1(key, true), z); routes.set('/download/' + s1(key, true) + '.CHECKSUM', hex(z) + '  ' + base + '\n'); oct.push(key);
}
console.log('routes', routes.size, 'synthetic listings', synthetic, 'real zips', real.size, 'synthetic October zips', oct.length);
// independent expectation
const ind = await freeze(async (prefix, marker) => { const r = routes.get('/list?delimiter=%2F&prefix=' + s1(prefix, false) + (marker === null ? '' : '&marker=' + s1(marker, false))); if (!r) throw new Error('indep: no route ' + prefix); return r; });
const st = new Map(), allRows = [];
for (const k of ind.keys) { const p = '/download/' + s1(k, true); const c = check(k, routes.get(p + '.CHECKSUM'), routes.get(p), rule); st.set(k, { ...c, hash: hex(routes.get(p)), size: routes.get(p).length }); }
// m9-scan run
const r = await run(routes);
console.log('m9 exit', r.code, 'requests', r.requests.length, 'distinct', new Set(r.requests).size);
const sorted = a => [...a].sort((x, y) => Buffer.compare(Buffer.from(x), Buffer.from(y)));
assert.equal(text(r, 'symbols.txt'), ind.symbols.join('\n') + '\n');
assert.equal(text(r, 'keys.txt'), ind.keys.join('\n') + '\n');
const sum = Object.fromEntries(text(r, 'summary.txt').trim().split('\n').map(l => [l.slice(0, l.indexOf(' ')), l.slice(l.indexOf(' ') + 1)]));
for (const [k, v] of Object.entries(ind.counts)) assert.equal(sum[k], String(v), k);
assert.equal(sum.symbols_listed, String(ind.symbols.length)); assert.equal(sum.keys_frozen, String(ind.keys.length));
const syms = sorted(new Set(ind.keys.map(k => k.split('/')[0]))); assert.equal(sum.symbols_with_keys, String(syms.length));
// O4: every allowed month of every symbol with a frozen key
const o4 = [];
for (const s of syms) for (const m of MONTHS) { const k = s + '/' + s + '-fundingRate-' + m + '.zip', x = st.get(k);
  o4.push([s, m, x ? x.status : 'not_listed', x ? x.hash : '', x && m !== '2025-10' ? x.size : ''].join(',')); }
assert.equal(text(r, 'manifest.csv'), 'symbol,month,status,zip_sha256,zip_bytes\n' + o4.join('\n') + '\n');
// O0 rows without segment: symbol, calc_time, h of verified_nonempty files
const o0 = text(r, 'timing.csv').trim().split('\n').slice(1).map(l => { const f = l.split(','); return [f[0], f[2], f[3]].join(','); });
const exp0 = []; for (const k of ind.keys) { const x = st.get(k); if (x.status === 'verified_nonempty') for (const [t, h] of x.rows) exp0.push([k.split('/')[0], t, h].join(',')); }
assert.deepEqual(o0, exp0);
const statuses = {}; for (const x of st.values()) statuses[x.status] = (statuses[x.status] || 0) + 1;
console.log('indep statuses', JSON.stringify(statuses), 'O0 rows', exp0.length, 'outcome', JSON.stringify(text(r, 'outcome.csv')));
console.log('fixtures.csv', JSON.stringify(text(r, 'fixtures/fixtures.csv')));
console.log('summary', JSON.stringify(Object.fromEntries(Object.entries(sum).filter(([k]) => /^(listing_pages|prefixes_received|dropped|symbols|noncanonical|keys_frozen|final:)/.test(k) && sum[k] !== '0'))));
const fx = Object.keys(r.files).filter(f => f.startsWith('fixtures/') && f !== 'fixtures/fixtures.csv');
for (const f of fx) { const k = ind.keys.find(k => k.endsWith('/' + f.slice(9).replace(/\.CHECKSUM$/, ''))); const path = '/download/' + s1(k, true) + (f.endsWith('.CHECKSUM') ? '.CHECKSUM' : ''); assert.ok(r.files[f].equals(Buffer.from(routes.get(path))), f); }
console.log('fixture files byte-equal to served bytes:', fx.length);
console.log('ALL COMPARISONS PASS');
