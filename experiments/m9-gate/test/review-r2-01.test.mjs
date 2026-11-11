// m9 finding R2-01 (cloud review of m9 round 2). Spec v6.2 S1: "Any other object name (other months, other sidecars, non-canonical
// names) is counted in O6 and never fetched." and "A repeated page, cursor or key, or pagination that does not end, leaves the freeze
// unresolved (F1)." A symbol listing that returns a directory-marker key byte-identical to the symbol prefix from the root listing is
// not a repeated key: it is counted in O6, never fetched, and the freeze continues. A repeated key stays unresolved (F1).
// Scenario C (the same prefix on two root pages stays unresolved) is covered by scan.test.mjs:39; Q2-1 (the same key under symbol A
// and symbol B) by review-r2.test.mjs:32. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, status, text, key, page, listPath, downloadPath, root } from './support.mjs';

const S = 'AAAUSDT', k = key(S, '2025-05'), marker = root + S + '/';
const o6 = r => { const m = /\nnoncanonical_names (\d+)\n/.exec(text(r, 'summary.txt')); assert.ok(m, 'summary.txt has noncanonical_names'); return +m[1]; };
// One canonical zip and its .CHECKSUM in the symbol listing, with or without the directory-marker key first (S3 key order).
function stub(withMarker) {
 const routes = sources([{ symbol: S, month: '2025-05' }]);
 routes.set(listPath(marker), page([], [...(withMarker ? [marker] : []), root + k, root + k + '.CHECKSUM']));
 return routes;
}

test('R2-01 A S1/O6: a symbol-listing key byte-identical to the root prefix is counted in O6 (+1), never fetched; the freeze resolves', async () => {
 const base = await run(stub(false)), r = await run(stub(true));
 assert.equal(base.code, 0); assert.equal(r.code, 0);
 assert.doesNotMatch(text(base, 'outcome.csv'), /freeze_unresolved/);
 assert.doesNotMatch(text(r, 'outcome.csv'), /freeze_unresolved/);
 assert.match(text(r, 'summary.txt'), /\nkeys_frozen 1\n/);
 assert.equal(o6(r), o6(base) + 1);
 // The marker object is never requested; the requests are exactly those of the run without the marker.
 for (const p of [downloadPath(S + '/'), downloadPath(S + '/') + '.CHECKSUM']) assert.ok(!r.requests.includes(p), 'never fetched: ' + p);
 assert.deepEqual(r.requests, base.requests);
 // The canonical key is processed as usual: every output equals the run without the marker, except the O6 count in summary.txt.
 status(r, S, '2025-05', 'verified_nonempty');
 assert.equal(text(r, 'keys.txt'), k + '\n');
 assert.deepEqual(Object.keys(r.files).sort(), Object.keys(base.files).sort());
 for (const p of Object.keys(base.files)) if (p !== 'summary.txt' && p !== 'checksums.sha256') assert.ok(r.files[p].equals(base.files[p]), 'same as without marker: ' + p);
 assert.equal(text(r, 'summary.txt'), text(base, 'summary.txt').replace(/\nnoncanonical_names \d+\n/, '\nnoncanonical_names ' + (o6(base) + 1) + '\n'));
});

test('R2-01 B S1/F1: the same marker key on page 1 and page 2 of one symbol listing (a repeated key) leaves the freeze unresolved; no download', async (t) => {
 const routes = new Map([
  [listPath(root), page([marker])],
  [listPath(marker), page([], [marker, root + k], root + k)],
  [listPath(marker, root + k), page([], [marker])],
 ]);
 const r = await run(routes);
 assert.equal(r.code, 0);
 assert.deepEqual(Object.keys(r.files).sort(), ['checksums.sha256', 'outcome.csv', 'summary.txt']);
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P0,freeze_unresolved\n');
 assert.ok(r.requests.every(p => p.startsWith('/list?')), 'listing requests only');
 assert.match(text(r, 'summary.txt'), /\nkeys_frozen 0\n/);
 // Not asserted (the prompt requires B to pass before the fix, when page 1 already freezes): the page on which the freeze ends.
 t.diagnostic(text(r, 'summary.txt').split('\n').find(l => l.startsWith('listing_pages ')));
});
