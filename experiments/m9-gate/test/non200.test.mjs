// D-10 probe: v6.2 F6 (C39, C44, C50): the sidecar size bound applies to HTTP 200 bodies only; non-200 bodies have a separate error-body limit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, status, listPath, root, key } from './support.mjs';
import { LIMITS, Budget, requester } from '../m9-scan.mjs';

const big404 = { stream: res => { res.writeHead(404); res.end(Buffer.alloc(LIMITS.sidecar + 1, 120)); } };
test('D-10: a 404 sidecar body one byte over the sidecar bound (4097 bytes) does not abort; v6.2 applies that bound to HTTP 200 only', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-05', sideResponse: big404 }]));
 assert.equal(LIMITS.sidecar, 4096);
 assert.equal(r.code, 0); assert.equal(r.invalid, null); status(r, 'A', '2025-05', 'excluded:missing_checksum');
});
test('D-10 with D-02: the same 404 body on a 2025-10 sidecar does not abort either', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-10', sideResponse: big404 }]));
 assert.equal(r.code, 0); assert.equal(r.invalid, null); status(r, 'A', '2025-10', 'excluded:missing_checksum');
});
// D-10 Test field and clarification: per-response error-body limit (LIMITS.errorBody, provisional until the run document's 404 probe).
const err = (code, n) => ({ stream: res => { res.writeHead(code); res.end(Buffer.alloc(n, 120)); } });
test('D-10: a 404 sidecar body exactly at the error-body limit does not abort', async () => {
 const r = await run(sources([{ symbol: 'A', month: '2025-05', sideResponse: err(404, LIMITS.errorBody) }]));
 assert.equal(r.code, 0); status(r, 'A', '2025-05', 'excluded:missing_checksum');
});
for (const [month, code, reason] of [['2025-05', 404, 'error_body'], ['2025-05', 503, 'error_body'], ['2025-10', 404, 'resource_2025_10']])
 test('D-10: a ' + code + ' sidecar body one byte over the error-body limit in a ' + month + ' file stops the run with ' + reason, async () => {
  const r = await run(sources([{ symbol: 'A', month, sideResponse: err(code, LIMITS.errorBody + 1) }]));
  assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid ' + reason + '\n'); assert.deepEqual(r.names, ['out0.invalid']); assert.deepEqual(r.stdout, ['invalid ' + reason + '\n']);
 });
test('D-10: a non-200 listing body over the error-body limit stops the run with error_body', async () => {
 const r = await run(new Map([[listPath(root), err(500, LIMITS.errorBody + 1)]]));
 assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid error_body\n'); assert.deepEqual(r.names, ['out0.invalid']);
});
test('D-10/F6: the received-byte total counts every 404 body byte of every attempt', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05', sideResponse: err(404, 100) }]);
 const original = Budget.prototype.receive; let total = 0;
 Budget.prototype.receive = function (...a) { const v = original.apply(this, a); total = this.total; return v; };
 try { const r = await run(routes); status(r, 'A', '2025-05', 'excluded:missing_checksum'); }
 finally { Budget.prototype.receive = original; }
 assert.equal(total, Buffer.byteLength(routes.get(listPath(root))) + Buffer.byteLength(routes.get(listPath(root + 'A/'))) + 4 * 100);
});
// D-11: F6 "never decoded, retained or reported": a requester unit test with a stubbed fetch returning 404.
test('D-11: a non-200 body is consumed for accounting only: no chunk retained, Buffer.concat never called', async () => {
 const chunks = [Buffer.from('error body one'), Buffer.from('error body two')];
 const fetchOrig = globalThis.fetch, concatOrig = Buffer.concat, pushOrig = Array.prototype.push;
 let concats = 0, retained = 0, res;
 const budget = new Budget(), get = requester({ pause: 0, retry: 0 }, budget);
 globalThis.fetch = async () => ({ status: 404, body: (async function* () { for (const c of chunks) yield c; })() });
 Buffer.concat = function (...a) { concats++; return concatOrig.apply(this, a); };
 Array.prototype.push = function (...a) { if (a.some(x => x === chunks[0] || x === chunks[1])) retained++; return pushOrig.apply(this, a); };
 try { res = await get('sidecar', 'http://127.0.0.1:9/' + key('A', '2025-05') + '.CHECKSUM'); }
 finally { globalThis.fetch = fetchOrig; Buffer.concat = concatOrig; Array.prototype.push = pushOrig; }
 assert.deepEqual(res, { status: 404, body: null });
 assert.equal(concats, 0, 'Buffer.concat called'); assert.equal(retained, 0, 'chunk retained');
 assert.equal(budget.total, 2 * (chunks[0].length + chunks[1].length));
});
