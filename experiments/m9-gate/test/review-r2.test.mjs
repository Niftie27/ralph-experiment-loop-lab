// m9 fix round 2 (PR #4 review): Q2-1 (S1 repeated key across listings), M-01 (F6 content encoding, rule D2 approved by Tomas
// 2026-11-02) and Q8-2 (D-11 decode guard). D2: every request sends accept-encoding: identity; a response whose Content-Encoding is
// present and is not identity (case-insensitive, trimmed) is never read: its body is cancelled unread; on HTTP 200 the attempt fails
// (F2), on any other status that status is used; a valid decimal Content-Length counts as received bytes (HTTP 200: the total only;
// otherwise the total and the per-response error body), with the same bounds and abort reasons as read bytes. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { StringDecoder } from 'node:string_decoder';
import { sources, run, status, text, key, page, listPath, downloadPath, root, zip, csv, sidecar, closure } from './support.mjs';
import { main, LIMITS, Budget, Abort, requester } from '../m9-scan.mjs';

const k5 = key('A', '2025-05'), NAME5 = 'A-fundingRate-2025-05.csv';
const listed = routes => Buffer.byteLength(routes.get(listPath(root))) + Buffer.byteLength(routes.get(listPath(root + 'A/')));
// A response with Content-Encoding: gzip and the exact Content-Length of the bytes sent.
const encoded = (code, body) => ({ stream: res => { res.writeHead(code, { 'Content-Encoding': 'gzip', 'Content-Length': body.length }); res.end(body); } });
// The run's final received-byte total (the Budget instance the scan used).
async function runTotal(routes) {
 const original = Budget.prototype.receive; let budget = null;
 Budget.prototype.receive = function (...a) { budget = this; return original.apply(this, a); };
 let r;
 try { r = await run(routes); } finally { Budget.prototype.receive = original; }
 return { r, total: budget.total };
}

// S1: "A repeated page, cursor or key, or pagination that does not end, leaves the freeze unresolved (F1)"; the clause gives no scope.
test('Q2-1 S1/F1: a key in the listing of symbol B byte-identical to a key listed under symbol A leaves the freeze unresolved; F1 outputs only, no download', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }], ['A', 'B']);
 routes.set(listPath(root + 'B/'), page([], [root + k5]));
 const r = await run(routes);
 assert.equal(r.code, 0);
 assert.deepEqual(Object.keys(r.files).sort(), ['checksums.sha256', 'outcome.csv', 'summary.txt']);
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
 assert.deepEqual(r.requests, [listPath(root), listPath(root + 'A/'), listPath(root + 'B/')]);
 assert.match(text(r, 'summary.txt'), /\nkeys_frozen 0\n/);
});

test('M-01a F6/D2: every request (listing, .CHECKSUM, zip) carries the header accept-encoding: identity', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }]), seen = [];
 const server = createServer((req, res) => { seen.push([req.url, req.headers['accept-encoding']]); const v = routes.get(req.url); if (v === undefined) { res.writeHead(404); res.end(); } else { res.writeHead(200); res.end(v); } });
 server.listen(0, '127.0.0.1'); await once(server, 'listening');
 const o = 'http://127.0.0.1:' + server.address().port, temp = mkdtempSync(join(tmpdir(), 'm9r2-'));
 try {
  const code = await main(['--out', join(temp, 'out'), '--closure-root', closure, '--list-base', o + '/list', '--download-base', o + '/download/', '--pause-ms', '0', '--retry-ms', '0']);
  assert.equal(code, 0);
 } finally { server.closeAllConnections(); server.close(); if (existsSync(temp)) rmSync(temp, { recursive: true }); }
 assert.deepEqual(seen, [listPath(root), listPath(root + 'A/'), downloadPath(k5) + '.CHECKSUM', downloadPath(k5)].map(u => [u, 'identity']));
});

test('M-01b F6/D2/F2: a 200 sidecar with Content-Encoding: gzip is a failed attempt (not_verified after the completion pass); its body is never read', async () => {
 const z = zip(NAME5, csv(['2025-05-01T00:00Z', 8])), plain = Buffer.from(sidecar(k5, z)), gz = gzipSync(plain);
 assert.notEqual(gz.length, plain.length);
 const routes = sources([{ symbol: 'A', month: '2025-05', zip: z, sideResponse: encoded(200, gz) }]);
 const { r, total } = await runTotal(routes);
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'not_verified');
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,not_final_verified\n');
 assert.equal(r.counts.get(downloadPath(k5) + '.CHECKSUM'), 4); assert.equal(r.counts.get(downloadPath(k5)), undefined);
 assert.equal(total, listed(routes) + 4 * gz.length);
});

test('M-01b F6/D2/F2: a 200 zip with Content-Encoding: gzip is a failed attempt (not_verified after the completion pass); its body is never read', async () => {
 const z = zip(NAME5, csv(['2025-05-01T00:00Z', 8])), gz = gzipSync(z);
 assert.notEqual(gz.length, z.length);
 const routes = sources([{ symbol: 'A', month: '2025-05', zip: z, zipResponse: encoded(200, gz) }]);
 const { r, total } = await runTotal(routes);
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'not_verified');
 assert.equal(r.counts.get(downloadPath(k5) + '.CHECKSUM'), 2); assert.equal(r.counts.get(downloadPath(k5)), 4);
 assert.ok(!Object.keys(r.files).some(p => p.startsWith('fixtures/A-')));
 assert.equal(total, listed(routes) + 2 * Buffer.byteLength(sidecar(k5, z)) + 4 * gz.length);
});

test('M-01c F6/D2: a 404 sidecar with Content-Encoding: gzip is a 404 (excluded:missing_checksum); its Content-Length, not a decoded length, counts', async () => {
 const gz = gzipSync(Buffer.alloc(1000, 120));
 const routes = sources([{ symbol: 'A', month: '2025-05', sideResponse: encoded(404, gz) }]);
 const { r, total } = await runTotal(routes);
 assert.equal(r.code, 0); assert.equal(r.invalid, null); status(r, 'A', '2025-05', 'excluded:missing_checksum');
 assert.equal(total, listed(routes) + 4 * gz.length);
});

// The bytes sent are not a gzip stream; D2 never decodes them, so only the declared length decides.
const opaque = n => Buffer.alloc(n, 0xa5);
for (const [month, n, reason] of [['2025-05', LIMITS.errorBody, null], ['2025-05', LIMITS.errorBody + 1, 'error_body'], ['2025-10', LIMITS.errorBody + 1, 'resource_2025_10']])
 test('M-01c F6/D2: a 404 gzip sidecar with Content-Length ' + n + ' in a ' + month + ' file ' + (reason ? 'aborts with ' + reason : 'is no abort (at the error-body limit)'), async () => {
  const r = await run(sources([{ symbol: 'A', month, sideResponse: encoded(404, opaque(n)) }]));
  if (!reason) { assert.equal(r.code, 0); assert.equal(r.invalid, null); status(r, 'A', month, 'excluded:missing_checksum'); return; }
  assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid ' + reason + '\n'); assert.deepEqual(r.names, ['out0.invalid']); assert.deepEqual(r.stdout, ['invalid ' + reason + '\n']);
 });

// Requester unit tests: a stubbed fetch whose body counts pulls (highWaterMark 0: a pull happens only on a read) and cancels. The
// headers stub returns values unnormalized, so the trim and case rules of D2 are the requester's own.
function stub(code, headers, chunks = [Buffer.from('opaque body bytes')]) {
 const log = { fetches: 0, pulls: 0, cancels: 0 }, table = Object.fromEntries(Object.entries(headers).map(([n, v]) => [n.toLowerCase(), v]));
 const fetch = async () => {
  log.fetches++; let i = 0;
  return { status: code, headers: { get: n => table[n.toLowerCase()] ?? null }, body: new ReadableStream({ pull(c) { log.pulls++; if (i < chunks.length) c.enqueue(chunks[i++]); else c.close(); }, cancel() { log.cancels++; } }, { highWaterMark: 0 }) };
 };
 return { log, fetch };
}
async function request(s, kind = 'sidecar') {
 const original = globalThis.fetch, budget = new Budget();
 globalThis.fetch = s.fetch;
 try { return { res: await requester({ pause: 0, retry: 0 }, budget)(kind, 'http://127.0.0.1:9/' + k5 + '.CHECKSUM'), budget }; }
 finally { globalThis.fetch = original; }
}
test('M-01b F6/D2 (requester): a 200 body with Content-Encoding " GZip " is cancelled unread in both attempts; the attempts fail; Content-Length counts toward the total only', async () => {
 const s = stub(200, { 'Content-Encoding': ' GZip ', 'Content-Length': String(LIMITS.sidecar + 1) });
 const { res, budget } = await request(s);
 assert.deepEqual(res, { status: null, body: null });
 assert.deepEqual(s.log, { fetches: 2, pulls: 0, cancels: 2 });
 assert.equal(budget.total, 2 * (LIMITS.sidecar + 1));
});
test('M-01b F6/D2 (requester): Content-Encoding " Identity " is identity; the 200 body is read and returned', async () => {
 const s = stub(200, { 'Content-Encoding': ' Identity ' }, [Buffer.from('abc')]);
 const { res, budget } = await request(s);
 assert.equal(res.status, 200); assert.ok(res.body.equals(Buffer.from('abc')));
 assert.equal(s.log.cancels, 0); assert.equal(s.log.fetches, 1); assert.equal(budget.total, 3);
});
test('M-01c F6/D2 (requester): a 404 body with Content-Encoding: gzip is cancelled unread; status 404; Content-Length counts toward the total', async () => {
 const s = stub(404, { 'Content-Encoding': 'gzip', 'Content-Length': '1234' });
 const { res, budget } = await request(s);
 assert.deepEqual(res, { status: 404, body: null });
 assert.deepEqual(s.log, { fetches: 2, pulls: 0, cancels: 2 });
 assert.equal(budget.total, 2468);
});
test('M-01c F6/D2 (requester): a gzip 404 Content-Length at the error-body limit passes; one over aborts with error_body; over the total aborts with total', async () => {
 const at = await request(stub(404, { 'Content-Encoding': 'gzip', 'Content-Length': String(LIMITS.errorBody) }));
 assert.deepEqual(at.res, { status: 404, body: null }); assert.equal(at.budget.total, 2 * LIMITS.errorBody);
 const over = stub(503, { 'Content-Encoding': 'gzip', 'Content-Length': String(LIMITS.errorBody + 1) });
 await assert.rejects(request(over), e => e instanceof Abort && e.reason === 'error_body');
 assert.deepEqual(over.log, { fetches: 1, pulls: 0, cancels: 1 });
 for (const code of [200, 404]) await assert.rejects(request(stub(code, { 'Content-Encoding': 'gzip', 'Content-Length': String(LIMITS.total + 1) })), e => e instanceof Abort && e.reason === 'total', String(code));
});
test('M-01c F6/D2 (requester): without a valid decimal Content-Length an unread gzip body adds nothing', async () => {
 for (const length of [undefined, '', '12a', '-5', '1e3', '0x10', '1.5', '12, 12']) {
  const s = stub(404, length === undefined ? { 'Content-Encoding': 'gzip' } : { 'Content-Encoding': 'gzip', 'Content-Length': length });
  const { res, budget } = await request(s);
  assert.deepEqual(res, { status: 404, body: null }, String(length)); assert.equal(budget.total, 0, String(length)); assert.equal(s.log.pulls, 0, String(length));
 }
});

// Q8-2: D-11 asserts no retained chunk and no Buffer.concat; this guard fails if the requester decodes a non-200 body in any common
// way. Every decoding entry point is wrapped and records a hit when its input (or, for String.fromCharCode/fromCodePoint, its
// result) holds the marker; the response stub also counts text(), json(), arrayBuffer(), blob(), bytes() and formData().
const MARK = 'M9-Q8-2-NON200-MARKER';
test('Q8-2 F6/D-11: the requester never decodes a non-200 body (404 and 500 identity, 404 gzip)', async () => {
 const hits = [], restore = [];
 const marked = v => { try { const b = v instanceof ArrayBuffer ? Buffer.from(v) : ArrayBuffer.isView(v) ? Buffer.from(v.buffer, v.byteOffset, v.byteLength) : null; return b !== null && b.includes(MARK); } catch { return false; } };
 const wrap = (obj, name, hit) => {
  const orig = obj[name], own = Object.hasOwn(obj, name); if (typeof orig !== 'function') return;
  restore.push(() => { if (own) obj[name] = orig; else delete obj[name]; });
  obj[name] = function (...a) { const v = orig.apply(this, a); if (hit(this, a, v)) hits.push(name); return v; };
 };
 wrap(Buffer.prototype, 'toString', self => marked(self));
 for (const n of ['utf8Slice', 'latin1Slice', 'asciiSlice', 'ucs2Slice', 'base64Slice', 'base64urlSlice', 'hexSlice', 'toJSON']) wrap(Buffer.prototype, n, self => marked(self));
 wrap(Uint8Array.prototype, 'toString', self => marked(self));
 wrap(TextDecoder.prototype, 'decode', (self, a) => marked(a[0]));
 wrap(StringDecoder.prototype, 'write', (self, a) => marked(a[0])); wrap(StringDecoder.prototype, 'end', (self, a) => marked(a[0]));
 wrap(String, 'fromCharCode', (self, a, v) => typeof v === 'string' && v.includes(MARK)); wrap(String, 'fromCodePoint', (self, a, v) => typeof v === 'string' && v.includes(MARK));
 const chunks = () => [Buffer.from(MARK + ' one'), new Uint8Array(Buffer.from(' two ' + MARK))];
 const fake = (code, headers) => {
  const s = stub(code, headers, chunks()), fetch = s.fetch;
  s.fetch = async (...a) => { const res = await fetch(...a); for (const m of ['text', 'json', 'arrayBuffer', 'blob', 'bytes', 'formData']) res[m] = async () => { hits.push('response.' + m); return m === 'text' ? MARK : m === 'json' ? {} : new ArrayBuffer(0); }; return res; };
  return s;
 };
 const results = [];
 try {
  for (const [code, headers] of [[404, {}], [500, {}], [404, { 'Content-Encoding': 'gzip', 'Content-Length': '40' }]]) { const { res, budget } = await request(fake(code, headers)); results.push([res, budget.total]); }
 } finally { for (const f of restore.reverse()) f(); }
 assert.deepEqual(hits, [], 'a non-200 body was decoded');
 const n = chunks().reduce((a, c) => a + c.length, 0);
 assert.deepEqual(results.map(([res]) => res), [{ status: 404, body: null }, { status: 500, body: null }, { status: 404, body: null }]);
 assert.deepEqual(results.slice(0, 2).map(([, total]) => total), [2 * n, 2 * n]);
});
