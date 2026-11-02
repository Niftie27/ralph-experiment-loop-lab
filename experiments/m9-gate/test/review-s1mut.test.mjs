// Review harness s54/s1mut.mjs as committed tests (m9 fix batch): the real 4a root page with one inserted symbol prefix.
// Expected from v6.2 S1 (C29, C36): a forbidden character, or a symbol "." or "..", leaves the freeze unresolved; AAAZUSDT resolves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { run, text, listPath, root } from './support.mjs';

const real = readFileSync(new URL('../probe-4a/listing/root-default-001.xml', import.meta.url), 'utf8');
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const unesc = s => s.replace(/&(amp|lt|gt|quot|apos|#x[0-9a-fA-F]+|#[0-9]+);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e] ?? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)));
const empty = p => '<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>data.binance.vision</Name><Prefix>' + esc(p) + '</Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><Delimiter>/</Delimiter><IsTruncated>false</IsTruncated></ListBucketResult>';
const SIX = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'HYPEUSDT'];
// Default CHARS of s1mut.mjs, then FULLSYM=1 with CHARS='. ..' (D-08), then the OK control.
const cases = [...['#', '@', ';', '"', ',', ':', '+', '\t', '\u0085', '\u009f', ' ', '　', '﻿', '\u0001', '\u007f'].map(c => [JSON.stringify(c), 'AAA' + c + 'USDT', 'unresolved']),
 ['FULLSYM "."', '.', 'unresolved'], ['FULLSYM ".."', '..', 'unresolved'], ['OK', 'AAAZUSDT', 'resolved']];
for (const [label, sym, want] of cases) test('s1mut ' + label + ': freeze ' + want, async () => {
 const page = real.replace('<CommonPrefixes>', '<CommonPrefixes><Prefix>' + esc(root + sym + '/') + '</Prefix></CommonPrefixes><CommonPrefixes>');
 const routes = new Map([[listPath(root), page]]);
 for (const m of page.matchAll(/<CommonPrefixes><Prefix>([^<]*)<\/Prefix><\/CommonPrefixes>/g)) { const p = unesc(m[1]); if (!SIX.some(s => p === root + s + '/')) routes.set(listPath(p), empty(p)); }
 const r = await run(routes);
 assert.equal(r.code, 0);
 assert.equal((text(r, 'outcome.csv') || '').includes('freeze_unresolved') ? 'unresolved' : 'resolved', want);
});
