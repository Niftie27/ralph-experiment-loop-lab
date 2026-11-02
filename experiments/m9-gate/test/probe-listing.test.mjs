// m9 review probe (listing): S1 symbol rules, listing completeness, URL encoding, byte order, sidecar counting, F1 stop. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, page, listPath, downloadPath, root, key } from './support.mjs';

const H = '<ListBucketResult><IsTruncated>false</IsTruncated>', E = '</ListBucketResult>';
const cp = p => '<CommonPrefixes><Prefix>' + p + '</Prefix></CommonPrefixes>';
const outcome = r => text(r, 'outcome.csv');
const unresolved = r => { assert.equal(r.code, 0); assert.deepEqual(Object.keys(r.files).sort(), ['checksums.sha256', 'outcome.csv', 'summary.txt']); assert.equal(outcome(r), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n'); assert.deepEqual(r.requests, [listPath(root)]); };
const resolvedNoKey = r => { assert.equal(r.code, 0); assert.equal(outcome(r), 'stage,outcome,reason\nscript,P0,no_key\n'); };

// S1: the 25 code points that \s matches on Node 24.22.0 leave the freeze unresolved.
const WS = [0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff];
test('LST-1 S1: each of the 25 whitespace code points in a symbol leaves the freeze unresolved', async () => {
 assert.equal(WS.length, 25);
 for (const c of WS) { const r = await run(new Map([[listPath(root), page([root + 'A' + String.fromCodePoint(c) + 'USDT/'])]])); unresolved(r); }
});
// Not whitespace, not a control character (Cc), not otherwise forbidden by S1: the freeze resolves.
test('LST-2 S1: format characters U+180E, U+200B, U+2060, U+00AD are not forbidden; the freeze resolves', async () => {
 for (const c of [0x180e, 0x200b, 0x2060, 0xad]) { const s = 'A' + String.fromCodePoint(c) + 'USDT'; const r = await run(new Map([[listPath(root), page([root + s + '/'])], [listPath(root + s + '/'), page()]])); resolvedNoKey(r); assert.equal(text(r, 'symbols.txt'), s + '\n'); }
});
test('LST-3 S1: invalid UTF-8 forms in a symbol prefix (overlong, encoded surrogate, above U+10FFFF, truncated) leave the freeze unresolved', async () => {
 for (const bad of [[0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xe5, 0xb8]]) {
  const body = Buffer.concat([Buffer.from(H + '<CommonPrefixes><Prefix>' + root + 'A'), Buffer.from(bad), Buffer.from('USDT/</Prefix></CommonPrefixes>' + E)]);
  unresolved(await run(new Map([[listPath(root), body]])));
 }
});
test('LST-4 S1: forbidden characters produced by XML character references (space, NEL, comma, ".") leave the freeze unresolved', async () => {
 for (const ref of ['A&#x20;USDT', 'A&#x85;USDT', 'A&#44;USDT', '&#46;', '&#x2E;&#x2E;']) unresolved(await run(new Map([[listPath(root), H + cp(root + ref + '/') + E]])));
});
// S1: every immediate symbol prefix is listed; a CommonPrefixes element the parser does not read must not silently drop a symbol.
test('LST-5 S1: a CommonPrefixes element with an extra child never silently drops its symbol', async () => {
 const body = H + cp(root + 'A/') + '<CommonPrefixes><Prefix>' + root + 'B/</Prefix><X/></CommonPrefixes>' + E;
 const r = await run(new Map([[listPath(root), body], [listPath(root + 'A/'), page()], [listPath(root + 'B/'), page()]]));
 assert.ok(outcome(r).includes('freeze_unresolved') || text(r, 'symbols.txt').split('\n').includes('B'), 'symbol B dropped without an unresolved freeze');
});
// S1: unreserved bytes "-", ".", "_" and "~" stay unencoded in listing and download URLs (support.run rejects any other request path).
test('LST-6 S1: "-", ".", "_" and "~" in a symbol stay literal in listing and download URLs', async () => {
 const s = 'A-B.C_D~USDT', routes = sources([{ symbol: s, month: '2025-05' }]);
 const r = await run(routes);
 assert.ok(r.requests.includes('/list?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FA-B.C_D~USDT%2F'));
 assert.ok(r.requests.includes('/download/A-B.C_D~USDT/A-B.C_D~USDT-fundingRate-2025-05.zip.CHECKSUM'));
 assert.ok([...routes.keys()].every(p => r.requests.includes(p)));
 assert.match(outcome(r), /script,P3,/);
});
// S1 and O0/O4: symbol and key lists sorted by unsigned UTF-8 bytes (U+FF21 = EF BC A1 sorts before U+1F600 = F0 9F 98 80).
test('LST-7 S1/O8/O0/O4: symbols, keys, timing and manifest in unsigned UTF-8 byte order', async () => {
 const syms = ['A\u{1F600}USDT', 'AＡUSDT', 'AZUSDT'], want = ['AZUSDT', 'AＡUSDT', 'A\u{1F600}USDT'];
 const r = await run(sources(syms.map(symbol => ({ symbol, month: '2025-05' })), syms));
 assert.equal(text(r, 'symbols.txt'), want.join('\n') + '\n');
 assert.equal(text(r, 'keys.txt'), want.map(s => key(s, '2025-05')).join('\n') + '\n');
 assert.deepEqual(text(r, 'timing.csv').trim().split('\n').slice(1).map(l => l.split(',')[0]), want);
 assert.deepEqual([...new Set(text(r, 'manifest.csv').trim().split('\n').slice(1).map(l => l.split(',')[0]))], want);
});
// S1: a sidecar of an allowed month whose zip is not listed is "another sidecar": counted in O6, never fetched; it is no frozen key.
test('LST-8 S1/O6: an orphan sidecar of an allowed month is counted in noncanonical_names and never fetched', async () => {
 const routes = sources([{ symbol: 'A', month: '2025-05' }]), k5 = root + key('A', '2025-05'), k6 = root + key('A', '2025-06');
 routes.set(listPath(root + 'A/'), page([], [k5, k5 + '.CHECKSUM', k6 + '.CHECKSUM']));
 const r = await run(routes);
 assert.match(text(r, 'summary.txt'), /\nnoncanonical_names 1\n/); assert.match(text(r, 'summary.txt'), /\nkeys_frozen 1\n/);
 assert.ok(!r.requests.some(p => p.includes('2025-06')));
});
// F1: a symbol listing that fails after one retry stops the run: only O6, O13 and O11, no source object requested.
test('LST-9 F1: a failing symbol listing after another symbol listed keys gives F1 outputs only and no download', async () => {
 const routes = new Map([[listPath(root), page([root + 'A/', root + 'B/'])], [listPath(root + 'A/'), page([], [root + key('A', '2025-05')])], [listPath(root + 'B/'), 500]]);
 const r = await run(routes);
 assert.deepEqual(Object.keys(r.files).sort(), ['checksums.sha256', 'outcome.csv', 'summary.txt']);
 assert.equal(outcome(r), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
 assert.ok(r.requests.every(p => p.startsWith('/list?')));
 assert.match(text(r, 'summary.txt'), /\nkeys_frozen 0\n/);
});
