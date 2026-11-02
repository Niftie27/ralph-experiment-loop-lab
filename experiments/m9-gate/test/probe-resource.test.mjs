// m9 review probe (resource): F6 2025-10 reason in the completion pass, failed-attempt byte counting, key bound with sidecars,
// and the D-02 clarification "marker file and stdout carry only the reason". Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, status, listPath, root, key, page, time } from './support.mjs';
import { LIMITS, Budget, Abort } from '../m9-scan.mjs';

// F6: a resource abort while a 2025-10 file is processed records only resource_2025_10, also in the completion pass (F2).
test('RES-1 F6/F2: a 2025-10 sidecar over the 200-body bound in the completion pass aborts with resource_2025_10', async () => {
 const big = { stream: res => { res.writeHead(200); res.end(Buffer.alloc(LIMITS.sidecar + 1, 120)); } };
 const r = await run(sources([{ symbol: 'A', month: '2025-10', sideResponse: n => n <= 2 ? 503 : big }]));
 assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid resource_2025_10\n'); assert.deepEqual(r.names, ['out0.invalid']);
 assert.ok(r.stdout.every(l => !l.includes('sidecar')));
});
test('RES-2 F6: the same completion-pass abort in a 2025-05 file names the bound (control)', async () => {
 const big = { stream: res => { res.writeHead(200); res.end(Buffer.alloc(LIMITS.sidecar + 1, 120)); } };
 const r = await run(sources([{ symbol: 'A', month: '2025-05', sideResponse: n => n <= 2 ? 503 : big }]));
 assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid sidecar\n');
});
// F6: the byte counter covers failed attempts: bytes of an incomplete 200 body count in every attempt of both passes.
test('RES-3 F6: bytes of incomplete 200 bodies count toward the total in every attempt and in the completion pass', async () => {
 const short = { stream: res => { res.writeHead(200, { 'Content-Length': '100' }); res.write('short'); setTimeout(() => res.destroy(), 30); } };
 const routes = sources([{ symbol: 'A', month: '2025-05', sideResponse: short }]);
 const original = Budget.prototype.receive; let total = 0;
 Budget.prototype.receive = function (...a) { const v = original.apply(this, a); total = this.total; return v; };
 let r;
 try { r = await run(routes); } finally { Budget.prototype.receive = original; }
 status(r, 'A', '2025-05', 'not_verified');
 assert.equal(total, Buffer.byteLength(routes.get(listPath(root))) + Buffer.byteLength(routes.get(listPath(root + 'A/'))) + 4 * 5);
});
// F6: exactly 10,000 frozen zip keys, each with its listed .CHECKSUM, do not hit the key bound (sidecars are not keys); fetching starts.
test('RES-4 F6: 10,000 frozen zip keys plus 10,000 listed sidecars pass the key bound and reach the first source fetch', async () => {
 const routes = new Map(), syms = Array.from({ length: 1429 }, (_, i) => 'K' + String(i).padStart(4, '0'));
 routes.set(listPath(root), page(syms.map(s => root + s + '/')));
 syms.forEach((s, i) => { const months = i < 1428 ? ['04', '05', '06', '07', '08', '09', '10'] : ['04', '05', '06', '07']; routes.set(listPath(root + s + '/'), page([], months.flatMap(m => [root + key(s, '2025-' + m), root + key(s, '2025-' + m) + '.CHECKSUM']))); });
 const original = globalThis.fetch;
 globalThis.fetch = (url, ...rest) => String(url).includes('/download/') ? Promise.reject(new Abort('source_fetched')) : original(url, ...rest);
 let r;
 try { r = await run(routes); } finally { globalThis.fetch = original; }
 assert.equal(r.invalid, 'invalid source_fetched\n', 'key bound must not fire at 10,000 zip keys');
});
// D-02 clarification (reason2510.test.mjs): "Marker file and stdout carry only the reason"; F6: the single reason resource_2025_10.
// With more than 100 keys the scan's progress lines precede the abort and give the position of the 2025-10 key in the frozen order.
test('RES-5 F6/D-02: with 101 keys, an abort on the 2025-10 key leaves stdout with only the reason line', async () => {
 const entries = Array.from({ length: 100 }, (_, i) => ({ symbol: 'S' + String(i).padStart(3, '0'), month: '2025-05' }));
 entries.push({ symbol: 'S100', month: '2025-10', body: time('2025-10-17Z') + ',' + 'x'.repeat(65537 - 14) + '\n' });
 const routes = sources(entries);
 routes.set(listPath(root), page(entries.map(e => root + e.symbol + '/'))); // one root page (support paginates by 3; 34 pages exceed the 30-page cap)
 const r = await run(routes);
 assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid resource_2025_10\n');
 assert.deepEqual(r.stdout, ['invalid resource_2025_10\n']);
});
