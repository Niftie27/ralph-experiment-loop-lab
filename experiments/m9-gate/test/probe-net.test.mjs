// m9 review probe (net): S1 request scope, I1 availability and F6 non-200 handling. Local stubs only (127.0.0.1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { sources, run, status, text, key, downloadPath, listPath, root, zip, csv, sidecar, closure } from './support.mjs';
import { main, LIMITS } from '../m9-scan.mjs';

const k = key('A', '2025-05');
const redirect = { stream: res => { res.writeHead(302, { Location: '/elsewhere' }); res.end(); } };

// S1 defines the only request URLs; a 3xx Location is not one of them, so it is never requested (support.run also fails on any unexpected path).
test('NET-1 S1/I1: a 302 on the sidecar is not followed; the key is not_verified (P0 not_final_verified)', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }]);
 routes.set(downloadPath(k) + '.CHECKSUM', redirect);
 const r = await run(routes);
 assert.equal(r.code, 0); assert.ok(!r.requests.includes('/elsewhere'));
 status(r, 'A', '2025-05', 'not_verified');
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,not_final_verified\n');
});
test('NET-2 S1/I1: a 302 on the zip is not followed; the key is not_verified', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }]);
 routes.set(downloadPath(k), redirect);
 const r = await run(routes);
 assert.ok(!r.requests.includes('/elsewhere')); status(r, 'A', '2025-05', 'not_verified');
});
test('NET-3 S1/F1: a 302 on the root listing is not followed; freeze unresolved after one retry', async () => {
 const r = await run(new Map([[listPath(root), redirect]]));
 assert.deepEqual(r.requests, [listPath(root), listPath(root)]);
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
});
// I1 availability and F6: only an HTTP 200 body is a source body; any other status (here 206 with a valid sidecar body) is not available.
test('NET-4 I1/F6: a 206 sidecar response with a valid sidecar body is not used; the key is not_verified', async () => {
 const z = zip('A-fundingRate-2025-05.csv', csv(['2025-05-01T00:00Z', 8]));
 const r = await run(sources([{ symbol: 'A', month: '2025-05', zip: z, sideResponse: { stream: res => { res.writeHead(206); res.end(sidecar(k, z)); } } }]));
 status(r, 'A', '2025-05', 'not_verified');
 assert.ok(!Object.keys(r.files).some(p => p.startsWith('fixtures/A-')));
});
// F6: the byte counter covers every received HTTP body byte; a non-200 body is never decoded. A gzip-encoded 404 body of 97 received
// bytes is far below the per-response error-body limit, so it is no resource abort; the sidecar is absent (completion pass: missing_checksum).
test('NET-5 F6: a 404 sidecar body is counted as received bytes, not content-decoded (gzip 404 of ~100 B is no error_body abort)', async () => {
 const body = gzipSync(Buffer.alloc(LIMITS.errorBody + 1));
 assert.ok(body.length < 200);
 const r = await run(sources([{ symbol: 'A', month: '2025-05', sideResponse: { stream: res => { res.writeHead(404, { 'Content-Encoding': 'gzip', 'Content-Length': body.length }); res.end(body); } } }]));
 assert.equal(r.invalid, null, 'no resource abort');
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'excluded:missing_checksum');
});
// S1 "anonymous ListObjects v1": no credential header on any request.
test('NET-6 S1: every request is anonymous (no authorization or cookie header)', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }]), headers = [];
 const server = createServer((req, res) => { headers.push(req.headers); const v = routes.get(req.url); if (v === undefined) { res.writeHead(404); res.end(); } else { res.writeHead(200); res.end(v); } });
 server.listen(0, '127.0.0.1'); await once(server, 'listening');
 const o = 'http://127.0.0.1:' + server.address().port, temp = mkdtempSync(join(tmpdir(), 'm9probe-'));
 try {
  const code = await main(['--out', join(temp, 'out'), '--closure-root', closure, '--list-base', o + '/list', '--download-base', o + '/download/', '--pause-ms', '0', '--retry-ms', '0']);
  assert.equal(code, 0); assert.equal(headers.length, 4);
  for (const h of headers) { assert.equal(h.authorization, undefined); assert.equal(h.cookie, undefined); }
 } finally { server.closeAllConnections(); server.close(); if (existsSync(temp)) rmSync(temp, { recursive: true }); }
});
