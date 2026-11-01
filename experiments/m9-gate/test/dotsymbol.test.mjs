// D-08 probe: v6.2 S1 (C36): a symbol equal to "." or ".." leaves the freeze unresolved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { run, text, page, listPath, root } from './support.mjs';

for (const sym of ['.', '..']) test('D-08: symbol "' + sym + '" leaves the freeze unresolved: F1 outputs only, no symbol listing request', async () => {
 const r = await run(new Map([[listPath(root), page([root + sym + '/'])], [listPath(root + sym + '/'), page([], [])]]));
 assert.equal(r.code, 0);
 assert.deepEqual(Object.keys(r.files).sort(), ['checksums.sha256', 'outcome.csv', 'summary.txt']);
 assert.ok(!r.requests.includes(listPath(root + sym + '/')));
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
});
test('D-08 consequence: a key under ".." is never fetched; only the root listing is requested', async () => {
 const k = root + '../..-fundingRate-2025-05.zip';
 const r = await run(new Map([[listPath(root), page([root + '../'])], [listPath(root + '../'), page([], [k])]]));
 assert.deepEqual(r.requests, [listPath(root)]);
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
});
