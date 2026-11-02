// Claude review part 2 rest (session 53), not committed. Run: M9_CLOSURE_ROOT=<closure> node --test --test-reporter=tap experiments/m9-gate/review/r3.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sources, run, csv, time, text } from '../test/support.mjs';
import { enc, parsePage, ROOT } from '../m9-scan.mjs';
const dir = new URL('../probe-4a/', import.meta.url);
// Independent S1 encoder, written from the S1 sentence.
const S1 = s => [...Buffer.from(s,'utf8')].map(b => b<128 && /[A-Za-z0-9\-._~\/]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%'+b.toString(16).toUpperCase().padStart(2,'0')).join('');
const base = 'https://data.binance.vision/'+ROOT;
test('G2 download URLs on every real 4a listing name, 4a requests and 982 symbols', () => {
  const keys = readdirSync(new URL('listing/', dir)).filter(f => !f.startsWith('root')).flatMap(f => parsePage(readFileSync(new URL('listing/'+f, dir))).keys);
  assert.equal(keys.length, 416);
  for (const k of keys) for (const sfx of ['', '.CHECKSUM']) { const u = base+enc(k.slice(ROOT.length), true)+sfx; assert.equal(u, base+S1(k.slice(ROOT.length))+sfx); assert.equal(new URL(u).href, u); }
  const req = readFileSync(new URL('requests.csv', dir), 'utf8').trim().split('\n').slice(1).map(l => l.split(',')).filter(r => r[1]==='zip' || r[1]==='sidecar');
  assert.equal(req.length, 34);
  for (const r of req) { const u = r.slice(6).join(','), rel = decodeURIComponent(u.slice(base.length)).replace(/\.CHECKSUM$/, ''); assert.equal(r[3], '200'); assert.equal(base+enc(rel, true)+(u.endsWith('.CHECKSUM') ? '.CHECKSUM' : ''), u); }
  const syms = readFileSync(new URL('symbols.txt', dir), 'utf8').split('\n').filter(Boolean);
  assert.equal(syms.length, 982);
  for (const s of syms) { const u = base+enc(s+'/'+s+'-fundingRate-2025-05.zip', true); assert.equal(new URL(u).href, u); }
  for (const s of ['.', '..']) { const u = base+enc(s+'/'+s+'-fundingRate-2025-05.zip', true); assert.notEqual(new URL(u).href, u, 'N1: dot segment rewritten by the URL parser'); }
});
// N4 documents current behaviour (spec v6 decides): a non-200 sidecar body over 4,096 B aborts the whole run.
for (const [code, size, exit] of [[404, 4096, 0], [404, 4097, 3], [503, 4097, 3]]) test(`N4 sidecar ${code} body ${size} B gives exit ${exit}`, async () => {
  const body = 'x'.repeat(size);
  const r = await run(sources([{symbol:'A', month:'2025-05', sideResponse:{stream:res => {res.writeHead(code); res.end(body);}}}]));
  assert.equal(r.code, exit); if (exit) assert.equal(r.invalid, 'invalid sidecar\n');
});
// Seal invariance: same pre-seal rows, three different sealed tails in 2025-10.
test('seal: sealed tails change only the October zip_sha256 and checksums', async () => {
  const pre = [['2025-10-16T00:00Z',8],['2025-10-16T08:00Z',8],['2025-10-16T16:00Z',8]];
  const tails = ['', time('2025-10-17Z')+',8,a\n'+time('2025-10-17T08:00Z')+',8,b\n',
    time('2025-10-17Z')+',1,a\n'+time('2025-10-17T01:00Z')+',1,b\n'+time('2025-10-17T02:00Z')+',1,c\n'+time('2025-10-17T02:30Z')+',x,y,z\n'+time('2025-11-02Z')+',bad'];
  const res = [];
  for (const tail of tails) { const r = await run(sources([{symbol:'A', month:'2025-09', body:csv(['2025-09-30T16:00Z',8])}, {symbol:'A', month:'2025-10', body:csv(...pre)+tail}])); assert.equal(r.code, 0); res.push(r); }
  const strip = r => text(r, 'manifest.csv').split('\n').map(l => l.split(',').filter((_, i) => i !== 3).join(','));
  for (const r of res.slice(1)) {
    assert.deepEqual(Object.keys(r.files).sort(), Object.keys(res[0].files).sort());
    assert.deepEqual(Object.keys(res[0].files).filter(p => !res[0].files[p].equals(r.files[p])).sort(), ['checksums.sha256', 'manifest.csv']);
    assert.deepEqual(strip(r), strip(res[0]));
  }
});
