// Offline tests for experiments/m9-gate/probe-r1.mjs (cloud task cloud-probe-r1-2026-11-02, scenarios T01 to T38).
// An injected mock fetch serves a small mock world; no request leaves the process. pauseMs 0 and retryMs 0; temporary
// directories under os.tmpdir() are removed by each test; globalThis.fetch is checked to be restored after every run.
// Expected URLs are literal strings, never built with enc().
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { run, main, indices } from '../probe-r1.mjs';
// T40 reads checkOutput through the namespace, so this file still loads against a script without that export.
import * as probeR1 from '../probe-r1.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'probe-r1.mjs');
const R = 'data/futures/um/monthly/fundingRate/';
const LIST = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision';
const ROOT_URL = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F';
const DL = 'https://data.binance.vision/data/futures/um/monthly/fundingRate/';
const SIX = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'HYPEUSDT'];
const HJM = '哈基米USDT', HJM_URL = '%E5%93%88%E5%9F%BA%E7%B1%B3USDT';
const NOT_FOUND_BODY = '<Error><Code>NoSuchKey</Code></Error>';
const FILES = ['anomalies.csv', 'checksums.sha256', 'encoding.csv', 'listings.csv', 'notfound.csv', 'ram.csv', 'requests.csv', 'summary.txt'];
const SUMMARY_KEYS = ['started_utc', 'node', 'root_status', 'root_pages', 'prefixes_received',
 'six_present:BTCUSDT', 'six_present:ETHUSDT', 'six_present:SOLUSDT', 'six_present:XRPUSDT', 'six_present:DOGEUSDT', 'six_present:HYPEUSDT',
 'symbols_listed', 'bad_symbol_names', 'symbol_listings_ok', 'symbol_listings_not_verified', 'symbol_listings_parse_error', 'symbol_pages_max',
 'symbol_listings_over_scan_cap', 'keys_total', 'markers_equal_listing_prefix', 'keys_trailing_slash', 'keys_equal_any_listed_prefix',
 'repeated_keys', 'repeated_prefixes', 'nonunreserved_keys', 'noncanonical_any_month', 'g2_checked', 'g2_status_200', 'notfound_checked',
 'error_body_max_bytes', 'limits_error_body', 'error_body_abort_m9', 'sample_zip', 'sample_sidecar_2504_2509', 'sample_sidecar_2510',
 'enc:listing:absent', 'enc:listing:identity', 'enc:listing:other', 'enc:zip:absent', 'enc:zip:identity', 'enc:zip:other',
 'enc:sidecar:absent', 'enc:sidecar:identity', 'enc:sidecar:other', 'enc:error:absent', 'enc:error:identity', 'enc:error:other',
 'crosscheck_mismatch', 'requests_total', 'bytes_received_total', 'max_rss_kb', 'duration_ms', 'finished_utc'];
const MEMINFO = 'MemTotal:        2000000 kB\nMemFree:          100000 kB\nMemAvailable:    1500000 kB\nSwapCached:            0 kB\nSwapTotal:          4096 kB\nSwapFree:           1024 kB\n';
const MONTHS9 = ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11'];
const OTHERS = ['AAAUSDT', 'BBBUSDT', 'CCCUSDT', 'DDDUSDT', 'EEEUSDT', 'FFFUSDT', 'GGGUSDT', 'TREEUSDT', HJM];

const digest = b => createHash('sha256').update(b).digest('hex');
const bytesort = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const xml = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function page({ prefixes = [], keys = [], next = null, truncated = next !== null }) {
 return '<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><IsTruncated>' + truncated + '</IsTruncated>' +
  keys.map(k => '<Contents><Key>' + xml(k) + '</Key><Size>1</Size></Contents>').join('') +
  prefixes.map(p => '<CommonPrefixes><Prefix>' + xml(p) + '</Prefix></CommonPrefixes>').join('') +
  (next === null ? '' : '<NextMarker>' + xml(next) + '</NextMarker>') + '</ListBucketResult>';
}
function paginate(items, size, field) {
 const pages = [];
 for (let i = 0; i < Math.max(1, items.length); i += size) { const chunk = items.slice(i, i + size); pages.push({ [field]: chunk, next: i + size < items.length ? chunk.at(-1) : null }); }
 return pages;
}
const rootPages = (symbols, size = 1000) => paginate(symbols.map(s => R + s + '/'), size, 'prefixes');
const keysOf = (s, months, { zip = true, checksum = true } = {}) => months.flatMap(m => [...(zip ? [R + s + '/' + s + '-fundingRate-' + m + '.zip'] : []), ...(checksum ? [R + s + '/' + s + '-fundingRate-' + m + '.zip.CHECKSUM'] : [])]);
const emptyPages = (n, tag) => Array.from({ length: n }, (_, i) => ({ keys: [], next: i < n - 1 ? tag + i : null }));
const respond = (status, body, headers = {}) => () => new Response(Buffer.from(body), { status, headers });

// The mock world: listing pages per prefix (strict: an unknown listing URL is recorded and answered 404), object responses per
// full key (default: 200 for a listed key, 404 with NOT_FOUND_BODY otherwise). hook(url, n) may answer first.
function world({ root, lists = {}, objects = {}, hook } = {}) {
 const calls = [], unknown = [], counts = new Map(), listed = new Set();
 for (const pages of Object.values(lists)) for (const p of pages) for (const k of p.keys || []) listed.add(k);
 async function fetch(url, init) {
  calls.push({ url, init });
  const n = (counts.get(url) || 0) + 1;
  counts.set(url, n);
  if (hook) { const r = await hook(url, n); if (r !== undefined) return r; }
  if (url.startsWith(LIST + '?')) {
   const q = new URL(url).searchParams, prefix = q.get('prefix'), marker = q.get('marker');
   const pages = prefix === R ? root : lists[prefix];
   const i = !pages ? -1 : marker === null ? 0 : pages.findIndex((p, j) => j > 0 && pages[j - 1].next === marker);
   if (i < 0) { unknown.push(url); return new Response('', { status: 404 }); }
   return new Response(pages[i].raw ?? page(pages[i]), { status: 200, headers: { 'content-type': 'application/xml' } });
  }
  if (url.startsWith(DL)) {
   const key = R + url.slice(DL.length).split('/').map(decodeURIComponent).join('/');
   if (Object.hasOwn(objects, key)) return objects[key](n);
   if (listed.has(key)) return new Response(Buffer.from('object ' + key), { status: 200, headers: { 'content-type': 'application/octet-stream' } });
   return new Response(Buffer.from(NOT_FOUND_BODY), { status: 404, headers: { 'content-type': 'application/xml' } });
  }
  unknown.push(url);
  throw new TypeError('fetch failed');
 }
 return { fetch, calls, unknown, counts };
}
function standard(extra = {}) {
 const all = [...OTHERS, ...SIX].sort(bytesort);
 return world({ root: rootPages(all, 8), lists: Object.fromEntries(OTHERS.map(s => [R + s + '/', [{ keys: keysOf(s, MONTHS9) }]])), ...extra });
}
function simple(listings, extra = {}) {
 return world({ root: rootPages(Object.keys(listings)), lists: Object.fromEntries(Object.entries(listings).map(([s, keys]) => [R + s + '/', keys.every(k => typeof k === 'string') ? [{ keys }] : keys])), ...extra });
}
async function probe(w, { opts = {}, deps = {}, before } = {}) {
 const tmp = mkdtempSync(join(tmpdir(), 'probe-r1-')), out = join(tmp, 'out');
 if (before) before(out);
 const previous = globalThis.fetch, lines = [], write = process.stdout.write;
 process.stdout.write = function (chunk, ...rest) { if (typeof chunk === 'string') lines.push(chunk); return write.call(this, chunk, ...rest); };
 let code;
 try {
  code = await run({ out, pauseMs: 0, retryMs: 0, capBytes: 134217728, capRequests: 3000, capOutput: 16777216, ...opts },
   { fetch: w.fetch, version: 'v24.22.0', readMeminfo: () => MEMINFO, now: Date.now, ...deps });
 } finally { process.stdout.write = write; }
 assert.equal(globalThis.fetch, previous, 'globalThis.fetch restored');
 const files = existsSync(out) ? Object.fromEntries(readdirSync(out).sort().map(f => [f, readFileSync(join(out, f), 'utf8')])) : null;
 rmSync(tmp, { recursive: true, force: true });
 assert.ok(!existsSync(tmp));
 return { code, files, stdout: lines.join(''), out, tmp, calls: w.calls, urls: w.calls.map(c => c.url), unknown: w.unknown, counts: w.counts };
}
function parseCsv(text) {
 const rows = [];
 let row = [], f = '', q = false;
 for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
  else if (c === '"') q = true;
  else if (c === ',') { row.push(f); f = ''; }
  else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
  else f += c;
 }
 return rows;
}
const table = (r, name) => { const [h, ...rows] = parseCsv(r.files[name]); return rows.map(x => Object.fromEntries(h.map((k, i) => [k, x[i]]))); };
const summary = r => Object.fromEntries(r.files['summary.txt'].slice(0, -1).split('\n').map(l => [l.slice(0, l.indexOf(' ')), l.slice(l.indexOf(' ') + 1)]));
const anomalies = (r, type) => table(r, 'anomalies.csv').filter(a => a.type === type);
const objectUrls = r => r.urls.filter(u => u.startsWith(DL));
const isRootListing = u => u === ROOT_URL || u.startsWith(ROOT_URL + '&marker=');

test('T01 wrong Node version: exit 2, zero fetch calls, out not created', async () => {
 const w = standard();
 const r = await probe(w, { deps: { version: 'v22.0.0' } });
 assert.equal(r.code, 2);
 assert.equal(r.calls.length, 0);
 assert.equal(r.files, null);
 assert.equal(r.stdout, 'stop node v22.0.0\n');
});

test('T02 out exists: exit 2, zero fetch calls, existing content unchanged', async () => {
 const w = standard();
 const r = await probe(w, { before: out => { mkdirSync(out); writeFileSync(join(out, 'keep.txt'), 'keep\n'); } });
 assert.equal(r.code, 2);
 assert.equal(r.calls.length, 0);
 assert.deepEqual(r.files, { 'keep.txt': 'keep\n' });
 assert.equal(r.stdout, 'stop out_exists\n');
});

test('T02 non-recursive mkdir: a missing parent stops with exit 2 and creates nothing', async () => {
 const w = standard(), tmp = mkdtempSync(join(tmpdir(), 'probe-r1-')), out = join(tmp, 'missing', 'out');
 try {
  const code = await run({ out, pauseMs: 0, retryMs: 0, capBytes: 1000, capRequests: 10, capOutput: 16777216 }, { fetch: w.fetch, version: 'v24.22.0', readMeminfo: () => MEMINFO, now: Date.now });
  assert.equal(code, 2);
  assert.equal(w.calls.length, 0);
  assert.deepEqual(readdirSync(tmp), []);
 } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('T03 missing --out or unknown argument: exit 2, no request', async () => {
 const previous = globalThis.fetch, lines = [], write = process.stdout.write;
 let requests = 0;
 globalThis.fetch = async () => { requests++; throw new Error('no request expected'); };
 process.stdout.write = function (chunk, ...rest) { if (typeof chunk === 'string') lines.push(chunk); return write.call(this, chunk, ...rest); };
 try {
  assert.equal(await main([]), 2);
  assert.equal(await main(['--out']), 2);
  assert.equal(await main(['--bogus', 'x']), 2);
  assert.equal(await main(['--out', 'x', '--pause-ms', '0']), 2);
  assert.equal(await main(['--out', 'x', '--out', 'y']), 2);
 } finally { process.stdout.write = write; globalThis.fetch = previous; }
 assert.equal(requests, 0);
 assert.deepEqual(lines, ['stop out_missing\n', 'stop out_missing\n', 'stop unknown_argument\n', 'stop unknown_argument\n', 'stop unknown_argument\n']);
 const w = standard();
 const r = await probe(w, { opts: { out: '' } });
 assert.equal(r.code, 2);
 assert.equal(r.calls.length, 0);
 assert.equal(r.stdout, 'stop out_missing\n');
});

test('T04 happy run: exit 0, exact output file set, exact summary order and values', async () => {
 const r = await probe(standard());
 assert.equal(r.code, 0);
 assert.deepEqual(r.unknown, []);
 assert.deepEqual(Object.keys(r.files), FILES);
 const s = summary(r);
 assert.deepEqual(Object.keys(s), SUMMARY_KEYS);
 assert.match(s.started_utc, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
 assert.match(s.finished_utc, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
 const expected = {
  node: 'v24.22.0', root_status: 'ok', root_pages: '2', prefixes_received: '15', symbols_listed: '9', bad_symbol_names: '0',
  symbol_listings_ok: '9', symbol_listings_not_verified: '0', symbol_listings_parse_error: '0', symbol_pages_max: '1',
  symbol_listings_over_scan_cap: '0', keys_total: '162', markers_equal_listing_prefix: '0', keys_trailing_slash: '0',
  keys_equal_any_listed_prefix: '0', repeated_keys: '0', repeated_prefixes: '0', nonunreserved_keys: '18', noncanonical_any_month: '0',
  g2_checked: '5', g2_status_200: '5', notfound_checked: '3', error_body_max_bytes: String(Buffer.byteLength(NOT_FOUND_BODY)),
  limits_error_body: '65536', error_body_abort_m9: '0', sample_zip: '6', sample_sidecar_2504_2509: '6', sample_sidecar_2510: '3',
  'enc:listing:absent': '11', 'enc:listing:identity': '0', 'enc:listing:other': '0', 'enc:zip:absent': '6', 'enc:zip:identity': '0',
  'enc:zip:other': '0', 'enc:sidecar:absent': '14', 'enc:sidecar:identity': '0', 'enc:sidecar:other': '0', 'enc:error:absent': '3',
  'enc:error:identity': '0', 'enc:error:other': '0', crosscheck_mismatch: '0', requests_total: '61'
 };
 for (const s6 of SIX) expected['six_present:' + s6] = 'true';
 for (const [k, v] of Object.entries(expected)) assert.equal(s[k], v, k);
 assert.equal(+s.requests_total, r.calls.length);
 assert.match(s.bytes_received_total, /^[1-9][0-9]*$/);
 assert.equal(table(r, 'requests.csv').length, 61);
 assert.equal(table(r, 'listings.csv').map(l => l.symbol).join(' '), OTHERS.join(' '));
 assert.equal(r.stdout, 'done out\n');
});

test('T05 call log of the T04 run: allowed URLs, no SIX below the root, zips only 2025-04..2025-09, objects only from the defined sets', async () => {
 const r = await probe(standard());
 assert.equal(r.code, 0);
 for (const u of r.urls) assert.ok(u.startsWith(LIST + '?') || u.startsWith(DL), 'allowed: ' + u);
 for (const u of r.urls) if (!isRootListing(u)) for (const s6 of SIX) assert.ok(!u.includes(s6), 'no SIX: ' + u);
 // The only zip of another month is the N1 404 probe key (month 2000-01, S3), itself one of the defined object sets.
 for (const u of r.urls) if (u.endsWith('.zip')) assert.match(u, /-fundingRate-(?:2025-0[4-9]|2000-01)\.zip$/);
 assert.deepEqual([...new Set(r.urls.filter(u => u.endsWith('-2000-01.zip')))], [DL + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip']);
 const z = (s, m) => DL + s + '/' + s + '-fundingRate-' + m + '.zip';
 const expected = [
  z('AAAUSDT', '2000-01'), z('AAAUSDT', '2000-01') + '.CHECKSUM', z(HJM_URL, '2000-01') + '.CHECKSUM',
  ...[['AAAUSDT', '2025-04'], ['BBBUSDT', '2025-08'], ['DDDUSDT', '2025-07'], ['FFFUSDT', '2025-05'], ['TREEUSDT', '2025-04'], [HJM_URL, '2025-09']].flatMap(([s, m]) => [z(s, m), z(s, m) + '.CHECKSUM']),
  z('AAAUSDT', '2025-10') + '.CHECKSUM', z('EEEUSDT', '2025-10') + '.CHECKSUM', z(HJM_URL, '2025-10') + '.CHECKSUM',
  ...['2025-04', '2025-05', '2025-06', '2025-07', '2025-08'].map(m => z(HJM_URL, m) + '.CHECKSUM')
 ];
 assert.deepEqual([...new Set(objectUrls(r))].sort(), [...new Set(expected)].sort());
 // m9-scan.mjs line 92 options on every request of both layers.
 for (const c of r.calls) {
  assert.equal(c.init.redirect, 'manual');
  assert.deepEqual(c.init.headers, { 'accept-encoding': 'identity' });
  assert.ok(c.init.signal instanceof AbortSignal);
 }
});

test('T06 disallowed URL via the guard (other host, http scheme, object outside ROOT): exit 3, only invalid.txt', async () => {
 const bad = ['https://example.com/', 'http://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-05.zip',
  'https://data.binance.vision/data/spot/monthly/klines/AAAUSDT/AAAUSDT-1m-2025-05.zip', 'https://data.binance.vision/data/futures/um/monthly/fundingRateX/A.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/../klines/A.zip', 'http://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F'];
 for (const url of bad) {
  const w = standard({ hook: async (u, n) => { if (u === ROOT_URL && n === 1) await globalThis.fetch(url, {}); } });
  const r = await probe(w);
  assert.equal(r.code, 3, url);
  assert.deepEqual(r.files, { 'invalid.txt': 'invalid url_not_allowed\n' });
  assert.deepEqual(r.urls, [ROOT_URL], 'the disallowed URL never reached fetch');
  assert.equal(r.stdout, 'invalid url_not_allowed\n');
 }
});

test('T07 SIX present in the root listing: six_present true, zero requests below them', async () => {
 const r = await probe(standard());
 assert.equal(r.code, 0);
 const s = summary(r);
 for (const s6 of SIX) assert.equal(s['six_present:' + s6], 'true');
 for (const u of r.urls) if (!isRootListing(u)) for (const s6 of SIX) assert.ok(!u.includes(s6), 'below a SIX symbol: ' + u);
 assert.equal(s.symbols_listed, '9');
 assert.ok(!table(r, 'listings.csv').some(l => SIX.includes(l.symbol)));
});

test('T08 static: the source does not contain node:zlib or inflate, and imports only the allowed m9-scan names', () => {
 const src = readFileSync(SCRIPT, 'utf8');
 assert.ok(!src.includes('node:zlib'));
 assert.ok(!src.includes('inflate'));
 const imports = [...src.matchAll(/^import .*$/gm)].map(m => m[0]);
 assert.deepEqual(imports.filter(l => l.includes('m9-scan')), ["import { ROOT, LIMITS, sha, enc, parsePage, requester, Budget, Abort } from './m9-scan.mjs';"]);
 assert.ok(!src.includes('f1-funding'));
});

test('T09 a 404 body with a unique marker string appears in no output file and not in stdout', async () => {
 const MARK = 'UNIQUE-404-MARKER-5e1f0c';
 const r = await probe(standard({ hook: async u => u.includes('-2000-01.') ? new Response(Buffer.from('<Error>' + MARK + '</Error>'), { status: 404 }) : undefined }));
 assert.equal(r.code, 0);
 assert.equal(summary(r).notfound_checked, '3');
 for (const [name, text] of Object.entries(r.files)) assert.ok(!text.includes(MARK), name);
 assert.ok(!r.stdout.includes(MARK));
});

test('T10 root pagination over 3 pages: URLs equal literal strings, including the marker parameter', async () => {
 const root = [{ prefixes: [R + 'AAAUSDT/'], next: R + 'AAAUSDT/' }, { prefixes: [R + '币安USDT/'], next: R + '币安USDT/' }, { prefixes: [R + '龙虾USDT/'] }];
 const w = world({ root, lists: { [R + 'AAAUSDT/']: [{ keys: [] }], [R + '币安USDT/']: [{ keys: [] }], [R + '龙虾USDT/']: [{ keys: [] }] } });
 const r = await probe(w);
 assert.equal(r.code, 0);
 assert.deepEqual(r.urls.slice(0, 7), [
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F&marker=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FAAAUSDT%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F&marker=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F%E5%B8%81%E5%AE%89USDT%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FAAAUSDT%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F%E5%B8%81%E5%AE%89USDT%2F',
  'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2F%E9%BE%99%E8%99%BEUSDT%2F'
 ]);
 assert.equal(summary(r).root_pages, '3');
 assert.deepEqual(table(r, 'requests.csv').slice(0, 2).map(x => x.layer), ['raw', 'm9']);
});

test('T11 root needing 31 pages: root_pages_over_scan_cap; 30 pages: no flag; more than 60: stops at 60 with root_cap_reached', async () => {
 const rootOf = n => Array.from({ length: n }, (_, i) => ({ prefixes: [], next: i < n - 1 ? 'cursor-' + i : null }));
 const r31 = await probe(world({ root: rootOf(31) }));
 assert.equal(r31.code, 0);
 assert.equal(summary(r31).root_pages, '31');
 assert.equal(summary(r31).root_status, 'ok');
 assert.deepEqual(anomalies(r31, 'root_pages_over_scan_cap').map(a => a.value), ['31']);
 assert.equal(anomalies(r31, 'root_cap_reached').length, 0);
 const r30 = await probe(world({ root: rootOf(30) }));
 assert.equal(anomalies(r30, 'root_pages_over_scan_cap').length, 0);
 const r70 = await probe(world({ root: rootOf(70) }));
 assert.equal(r70.code, 0);
 assert.equal(summary(r70).root_pages, '60');
 assert.equal(table(r70, 'requests.csv').filter(x => x.layer === 'raw' && isRootListing(x.url)).length, 60);
 assert.deepEqual(anomalies(r70, 'root_cap_reached').map(a => a.value), ['60']);
 assert.equal(anomalies(r70, 'root_pages_over_scan_cap').length, 1);
 assert.deepEqual(r70.unknown, []);
});

test('T12 symbol listing needing 6 pages is flagged; 5 pages is not; more than 10: stops at 10', async () => {
 const r6 = await probe(simple({ AAAUSDT: emptyPages(6, 'a'), BBBUSDT: emptyPages(5, 'b') }));
 assert.equal(r6.code, 0);
 assert.equal(summary(r6).symbol_listings_over_scan_cap, '1');
 assert.deepEqual(anomalies(r6, 'symbol_pages_over_scan_cap').map(a => [a.symbol, a.value]), [['AAAUSDT', '6']]);
 assert.equal(summary(r6).symbol_pages_max, '6');
 const r12 = await probe(simple({ AAAUSDT: emptyPages(12, 'a') }));
 assert.equal(summary(r12).symbol_pages_max, '10');
 assert.deepEqual(anomalies(r12, 'symbol_cap_reached').map(a => [a.symbol, a.value]), [['AAAUSDT', '10']]);
 assert.equal(r12.urls.filter(u => u.includes('prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FAAAUSDT%2F')).length, 10);
});

test('T13 directory marker key equal to the symbol prefix: counted, in anomalies, never fetched', async () => {
 const r = await probe(simple({ AAAUSDT: [R + 'AAAUSDT/', ...keysOf('AAAUSDT', ['2025-05'])] }));
 assert.equal(r.code, 0);
 const s = summary(r);
 assert.equal(s.markers_equal_listing_prefix, '1');
 assert.equal(s.keys_equal_any_listed_prefix, '1');
 assert.equal(table(r, 'listings.csv')[0].marker_equal_listing_prefix, '1');
 assert.deepEqual(anomalies(r, 'marker_equal_listing_prefix').map(a => [a.symbol, a.value]), [['AAAUSDT', R + 'AAAUSDT/']]);
 assert.deepEqual(anomalies(r, 'key_equal_listed_prefix').map(a => [a.symbol, a.value]), [['AAAUSDT', R + 'AAAUSDT/']]);
 for (const u of objectUrls(r)) assert.ok(!u.endsWith('/') && !u.endsWith('/.CHECKSUM'), 'marker fetched: ' + u);
 assert.ok(!r.urls.includes(DL + 'AAAUSDT/'));
});

test('T14 trailing-slash key not equal to any prefix: keys_trailing_slash only', async () => {
 const r = await probe(simple({ AAAUSDT: [R + 'AAAUSDT/sub/', ...keysOf('AAAUSDT', ['2025-05'])] }));
 assert.equal(r.code, 0);
 const s = summary(r);
 assert.equal(s.keys_trailing_slash, '1');
 assert.equal(s.markers_equal_listing_prefix, '0');
 assert.equal(s.keys_equal_any_listed_prefix, '0');
 assert.deepEqual(anomalies(r, 'key_trailing_slash').map(a => a.value), [R + 'AAAUSDT/sub/']);
 for (const u of objectUrls(r)) assert.ok(!u.includes('sub'));
});

test('T15 a key repeated across two listings and a repeated prefix: repeated_keys 1, repeated_prefixes 1, both in anomalies', async () => {
 const k = R + 'AAAUSDT/AAAUSDT-fundingRate-2025-05.zip';
 const root = [{ prefixes: [R + 'AAAUSDT/', R + 'BBBUSDT/'], next: R + 'BBBUSDT/' }, { prefixes: [R + 'AAAUSDT/'] }];
 const r = await probe(world({ root, lists: { [R + 'AAAUSDT/']: [{ keys: [k] }], [R + 'BBBUSDT/']: [{ keys: [k] }] } }));
 assert.equal(r.code, 0);
 const s = summary(r);
 assert.equal(s.repeated_keys, '1');
 assert.equal(s.repeated_prefixes, '1');
 assert.deepEqual(anomalies(r, 'repeated_key').map(a => [a.symbol, a.value]), [['BBBUSDT', k]]);
 assert.deepEqual(anomalies(r, 'repeated_prefix').map(a => [a.symbol, a.value]), [['', R + 'AAAUSDT/']]);
 assert.equal(r.counts.get('https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FAAAUSDT%2F'), 1);
});

test('T16 non-ASCII symbol with canonical 2025-10 keys: nonunreserved counted; G2 fetches only its .CHECKSUM at the literal URL', async () => {
 const r = await probe(simple({ AAAUSDT: keysOf('AAAUSDT', ['2025-05']), [HJM]: keysOf(HJM, ['2025-10']) }));
 assert.equal(r.code, 0);
 const s = summary(r);
 assert.equal(s.nonunreserved_keys, '2');
 assert.equal(table(r, 'listings.csv').find(l => l.symbol === HJM).nonunreserved_keys, '2');
 assert.equal(s.g2_checked, '1');
 assert.equal(s.g2_status_200, '1');
 const g2 = table(r, 'encoding.csv').filter(e => e.set === 'g2');
 assert.deepEqual(g2.map(e => e.key), [R + HJM + '/' + HJM + '-fundingRate-2025-10.zip.CHECKSUM']);
 const url = 'https://data.binance.vision/data/futures/um/monthly/fundingRate/%E5%93%88%E5%9F%BA%E7%B1%B3USDT/%E5%93%88%E5%9F%BA%E7%B1%B3USDT-fundingRate-2025-10.zip.CHECKSUM';
 assert.ok(r.urls.includes(url));
 assert.equal(table(r, 'requests.csv').filter(x => x.url === url && x.layer === 'raw').length, 2, 'one raw G2 request plus one raw 2025-10 sample request');
 for (const u of r.urls) if (u.includes(HJM_URL)) assert.ok(!u.endsWith('.zip'), 'zip of the non-ASCII symbol: ' + u);
});

test('T17 symbol names ".", "..", "A B", "A,B": bad_symbol_name, never listed', async () => {
 const root = [{ prefixes: [R + './', R + '../', R + 'A B/', R + 'A,B/', R + 'AAAUSDT/'] }];
 const r = await probe(world({ root, lists: { [R + 'AAAUSDT/']: [{ keys: [] }] } }));
 assert.equal(r.code, 0);
 assert.equal(summary(r).bad_symbol_names, '4');
 assert.deepEqual(anomalies(r, 'bad_symbol_name').map(a => a.value), ['.', '..', 'A B', 'A,B']);
 for (const u of r.urls) for (const bad of ['fundingRate%2F.%2F', 'fundingRate%2F..%2F', 'A%20B', 'A%2CB', 'A B', 'A,B']) assert.ok(!u.includes(bad), u);
 assert.equal(summary(r).symbols_listed, '1');
 assert.deepEqual(r.unknown, []);
});

test('T18 malformed XML in one symbol listing: parse_error, the run continues, exit 0', async () => {
 const r = await probe(simple({ AAAUSDT: [], BBBUSDT: [{ raw: '<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>x</Key>' }], CCCUSDT: [] }));
 assert.equal(r.code, 0);
 assert.deepEqual(table(r, 'listings.csv').map(l => [l.symbol, l.status]), [['AAAUSDT', 'ok'], ['BBBUSDT', 'parse_error'], ['CCCUSDT', 'ok']]);
 assert.equal(summary(r).symbol_listings_parse_error, '1');
});

test('T19 listing network error twice: not_verified and continue; once then success: ok with exactly 2 requests', async () => {
 const B = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=data%2Ffutures%2Fum%2Fmonthly%2FfundingRate%2FBBBUSDT%2F';
 const twice = await probe(simple({ AAAUSDT: [], BBBUSDT: [], CCCUSDT: [] }, { hook: async u => { if (u === B) throw new TypeError('fetch failed'); } }));
 assert.equal(twice.code, 0);
 assert.deepEqual(table(twice, 'listings.csv').map(l => [l.symbol, l.status]), [['AAAUSDT', 'ok'], ['BBBUSDT', 'not_verified'], ['CCCUSDT', 'ok']]);
 assert.equal(twice.counts.get(B), 2);
 assert.deepEqual(table(twice, 'requests.csv').filter(x => x.url === B).map(x => [x.attempt, x.status]), [['1', 'network_error'], ['2', 'network_error']]);
 const once = await probe(simple({ AAAUSDT: [], BBBUSDT: [], CCCUSDT: [] }, { hook: async (u, n) => { if (u === B && n === 1) throw new TypeError('fetch failed'); } }));
 assert.equal(table(once, 'listings.csv').find(l => l.symbol === 'BBBUSDT').status, 'ok');
 assert.equal(once.counts.get(B), 2);
});

test('T20 root fails twice: root_status not_verified, no further requests, all outputs written, exit 0', async () => {
 const r = await probe(standard({ hook: async u => { if (u === ROOT_URL) return new Response('busy', { status: 503 }); } }));
 assert.equal(r.code, 0);
 assert.deepEqual(r.urls, [ROOT_URL, ROOT_URL]);
 assert.deepEqual(Object.keys(r.files), FILES);
 const s = summary(r);
 assert.equal(s.root_status, 'not_verified');
 assert.equal(s.requests_total, '2');
 assert.equal(s['six_present:BTCUSDT'], 'not_verified');
 assert.equal(s['enc:error:absent'], '2');
 assert.equal(r.stdout, 'done out\n');
});

test('T21 noncanonical key counted in noncanonical_any_month; a canonical name of another month is not', async () => {
 const odd = R + 'AAAUSDT/AAAUSDT-fundingRate-2025-05.csv';
 const r = await probe(simple({ AAAUSDT: [...keysOf('AAAUSDT', ['2019-01', '2025-05']), odd] }));
 assert.equal(r.code, 0);
 assert.equal(summary(r).noncanonical_any_month, '1');
 assert.equal(table(r, 'listings.csv')[0].noncanonical_any_month, '1');
 assert.deepEqual(anomalies(r, 'noncanonical_key').map(a => a.value), [odd]);
 assert.ok(!r.urls.some(u => u.endsWith('.csv')));
});

test('T22 N1..N3 symbol choice by UTF-8 byte length (4-character CJK name = 12 bytes) with byte-order tie-break', async () => {
 const a = await probe(simple({ AB: [], AA: [], ABCDEFGHIJK: [], '哈基米牛': [] }));
 assert.deepEqual(table(a, 'notfound.csv').map(n => [n.id, n.url]), [
  ['N1', 'https://data.binance.vision/data/futures/um/monthly/fundingRate/AA/AA-fundingRate-2000-01.zip'],
  ['N2', 'https://data.binance.vision/data/futures/um/monthly/fundingRate/AA/AA-fundingRate-2000-01.zip.CHECKSUM'],
  ['N3', 'https://data.binance.vision/data/futures/um/monthly/fundingRate/%E5%93%88%E5%9F%BA%E7%B1%B3%E7%89%9B/%E5%93%88%E5%9F%BA%E7%B1%B3%E7%89%9B-fundingRate-2000-01.zip.CHECKSUM']
 ]);
 const b = await probe(simple({ AB: [], AA: [], ABCDEFGHIJK: [], '哈基米牛': [], ZZZZZZZZZZZZ: [] }));
 assert.equal(table(b, 'notfound.csv')[2].url, 'https://data.binance.vision/data/futures/um/monthly/fundingRate/ZZZZZZZZZZZZ/ZZZZZZZZZZZZ-fundingRate-2000-01.zip.CHECKSUM');
});

test('T23 404 bodies of known sizes: raw bytes exact, m9 status 404, Budget.total twice the bytes, error_body_max_bytes exact', async () => {
 const objects = {
  [R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip']: respond(404, 'a'.repeat(100), { 'content-type': 'application/xml' }),
  [R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip.CHECKSUM']: respond(404, 'b'.repeat(200)),
  [R + 'BBBBUSDT/BBBBUSDT-fundingRate-2000-01.zip.CHECKSUM']: respond(404, 'c'.repeat(300))
 };
 const r = await probe(simple({ AAAUSDT: [], BBBBUSDT: [] }, { objects }));
 assert.equal(r.code, 0);
 assert.deepEqual(table(r, 'notfound.csv').map(n => [n.id, n.raw_status, n.raw_body_bytes, n.m9_status, n.m9_budget_total, n.m9_equals_2x, n.m9_abort]), [
  ['N1', '404', '100', '404', '200', 'true', ''], ['N2', '404', '200', '404', '400', 'true', ''], ['N3', '404', '300', '404', '600', 'true', '']]);
 assert.equal(table(r, 'notfound.csv')[0].content_type, 'application/xml');
 assert.equal(summary(r).error_body_max_bytes, '300');
 assert.equal(summary(r).error_body_abort_m9, '0');
});

test('T24 404 body of 65,537 bytes: m9 Abort error_body recorded, raw bytes exact, the run continues, exit 0', async () => {
 const objects = { [R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip']: respond(404, 'x'.repeat(65537)) };
 const r = await probe(simple({ AAAUSDT: keysOf('AAAUSDT', ['2025-05']) }, { objects }));
 assert.equal(r.code, 0);
 const n = table(r, 'notfound.csv');
 assert.deepEqual([n[0].id, n[0].raw_body_bytes, n[0].m9_abort, n[0].m9_status, n[0].m9_budget_total, n[0].m9_equals_2x], ['N1', '65537', 'error_body', '', '65537', 'false']);
 assert.deepEqual(n.map(x => x.id), ['N1', 'N2', 'N3']);
 assert.equal(summary(r).error_body_abort_m9, '1');
 assert.equal(summary(r).error_body_max_bytes, '65537');
 assert.equal(summary(r).sample_zip, '1');
 assert.equal(r.stdout, 'done out\n');
});

test('T25 probe key present in the listing: n_key_listed, skipped', async () => {
 const listedKey = R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip';
 const r = await probe(simple({ AAAUSDT: [listedKey] }));
 assert.equal(r.code, 0);
 assert.deepEqual(anomalies(r, 'n_key_listed').map(a => [a.symbol, a.value]), [['AAAUSDT', listedKey]]);
 assert.ok(!r.urls.includes('https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2000-01.zip'));
 assert.deepEqual(table(r, 'notfound.csv').map(n => n.id), ['N2', 'N3']);
 assert.equal(summary(r).notfound_checked, '2');
});

test('T26 404 probe answered with 403 or 200: recorded as is', async () => {
 const objects = {
  [R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip']: respond(403, 'denied'),
  [R + 'AAAUSDT/AAAUSDT-fundingRate-2000-01.zip.CHECKSUM']: respond(200, 'present')
 };
 const r = await probe(simple({ AAAUSDT: [] }, { objects }));
 assert.equal(r.code, 0);
 assert.deepEqual(table(r, 'notfound.csv').slice(0, 2).map(n => [n.id, n.raw_status, n.raw_body_bytes, n.m9_status, n.m9_budget_total]),
  [['N1', '403', '6', '403', '12'], ['N2', '200', '7', '200', '7']]);
 const raw200 = table(r, 'requests.csv').find(x => x.layer === 'raw' && x.url.endsWith('2000-01.zip.CHECKSUM') && x.status === '200');
 assert.equal(raw200.sha256, digest('present'));
 assert.equal(summary(r)['enc:sidecar:absent'], '2', 'N2 and N3 (the only symbol is shortest and longest) answered 200');
});

test('T27 sample indices: n=13 gives 0,2,4,7,9,12; n=3 all; n=0 none; 2025-10 n=7 gives 0,3,6', async () => {
 assert.deepEqual(indices(13, 5), [0, 2, 4, 7, 9, 12]);
 assert.deepEqual(indices(3, 5), [0, 1, 2]);
 assert.deepEqual(indices(0, 5), []);
 assert.deepEqual(indices(7, 2), [0, 3, 6]);
 const six = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
 const listings = { AAAUSDT: keysOf('AAAUSDT', six), BBBUSDT: keysOf('BBBUSDT', six), CCCUSDT: keysOf('CCCUSDT', ['2025-04']) };
 for (let i = 1; i <= 7; i++) listings['T' + i + 'USDT'] = keysOf('T' + i + 'USDT', ['2025-10']);
 const r = await probe(simple(listings));
 assert.equal(r.code, 0);
 assert.deepEqual(objectUrls(r).filter(u => u.endsWith('.zip') && !u.includes('2000-01')), [
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-04.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-04.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-06.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-06.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-08.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-08.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/BBBUSDT/BBBUSDT-fundingRate-2025-05.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/BBBUSDT/BBBUSDT-fundingRate-2025-05.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/BBBUSDT/BBBUSDT-fundingRate-2025-07.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/BBBUSDT/BBBUSDT-fundingRate-2025-07.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/CCCUSDT/CCCUSDT-fundingRate-2025-04.zip',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/CCCUSDT/CCCUSDT-fundingRate-2025-04.zip'
 ], 'each sampled zip once raw and once m9');
 assert.deepEqual([...new Set(objectUrls(r).filter(u => u.includes('2025-10')))], [
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/T1USDT/T1USDT-fundingRate-2025-10.zip.CHECKSUM',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/T4USDT/T4USDT-fundingRate-2025-10.zip.CHECKSUM',
  'https://data.binance.vision/data/futures/um/monthly/fundingRate/T7USDT/T7USDT-fundingRate-2025-10.zip.CHECKSUM'
 ]);
 assert.equal(summary(r).sample_zip, '6');
 assert.equal(summary(r).sample_sidecar_2510, '3');
});

test('T28 a zip without listed .CHECKSUM is never sampled; 2025-10 only .CHECKSUM', async () => {
 const r = await probe(simple({
  AAAUSDT: keysOf('AAAUSDT', ['2025-05'], { checksum: false }), BBBUSDT: keysOf('BBBUSDT', ['2025-05']), CCCUSDT: keysOf('CCCUSDT', ['2025-10'])
 }));
 assert.equal(r.code, 0);
 assert.deepEqual(table(r, 'encoding.csv').filter(e => e.set === 'zip_2504_2509').map(e => e.key), [
  R + 'BBBUSDT/BBBUSDT-fundingRate-2025-05.zip.CHECKSUM', R + 'BBBUSDT/BBBUSDT-fundingRate-2025-05.zip']);
 assert.ok(!r.urls.includes('https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-05.zip'));
 assert.ok(!r.urls.includes('https://data.binance.vision/data/futures/um/monthly/fundingRate/CCCUSDT/CCCUSDT-fundingRate-2025-10.zip'));
 assert.ok(r.urls.includes('https://data.binance.vision/data/futures/um/monthly/fundingRate/CCCUSDT/CCCUSDT-fundingRate-2025-10.zip.CHECKSUM'));
 assert.equal(summary(r).sample_zip, '1');
 assert.equal(summary(r).sample_sidecar_2510, '1');
});

test('T29 zip answered with content-encoding gzip: raw records gzip and content-length, body cancelled unread; enc:zip:other 1', async () => {
 let pulled = 0, cancelled = 0;
 const gz = () => new Response(new ReadableStream({ pull(c) { pulled++; c.enqueue(new Uint8Array(64)); }, cancel() { cancelled++; } }, { highWaterMark: 0 }),
  { status: 200, headers: { 'content-encoding': 'gzip', 'content-length': '1234' } });
 const zipKey = R + 'AAAUSDT/AAAUSDT-fundingRate-2025-05.zip';
 const r = await probe(simple({ AAAUSDT: keysOf('AAAUSDT', ['2025-05']) }, { objects: { [zipKey]: gz } }));
 assert.equal(r.code, 0);
 const zipUrl = 'https://data.binance.vision/data/futures/um/monthly/fundingRate/AAAUSDT/AAAUSDT-fundingRate-2025-05.zip';
 const raw = table(r, 'requests.csv').filter(x => x.url === zipUrl && x.layer === 'raw');
 assert.deepEqual(raw.map(x => [x.status, x.content_encoding, x.content_length, x.body_bytes, x.sha256]), [['200', 'gzip', '1234', '', '']]);
 assert.equal(pulled, 0, 'no body byte read in either layer');
 assert.ok(cancelled >= 1);
 const s = summary(r);
 assert.equal(s['enc:zip:other'], '1');
 assert.equal(s['enc:zip:absent'], '0');
 const e = table(r, 'encoding.csv').find(x => x.key === zipKey);
 assert.deepEqual([e.raw_status, e.content_encoding, e.raw_bytes, e.m9_status, e.match], ['200', 'gzip', '', '', 'false']);
 assert.equal(table(r, 'requests.csv').filter(x => x.url === zipUrl && x.layer === 'm9').length, 2, 'm9 retries an encoded 200');
 assert.equal(s.crosscheck_mismatch, '1');
});

test('T30 header value " Identity " counts as identity', async () => {
 const sideKey = R + 'AAAUSDT/AAAUSDT-fundingRate-2025-05.zip.CHECKSUM';
 const fake = () => ({ status: 200, headers: { get: n => n === 'content-encoding' ? ' Identity ' : null }, body: new Response(Buffer.from('abc')).body });
 const r = await probe(simple({ AAAUSDT: keysOf('AAAUSDT', ['2025-05']) }, { objects: { [sideKey]: fake } }));
 assert.equal(r.code, 0);
 assert.equal(summary(r)['enc:sidecar:identity'], '1');
 assert.equal(summary(r)['enc:sidecar:other'], '0');
 const raw = table(r, 'requests.csv').find(x => x.layer === 'raw' && x.url.endsWith('2025-05.zip.CHECKSUM'));
 assert.deepEqual([raw.content_encoding, raw.body_bytes, raw.sha256], [' Identity ', '3', digest('abc')]);
 assert.equal(table(r, 'encoding.csv').find(x => x.key === sideKey).match, 'true');
});

test('T31 raw and m9 bytes equal: match true; the second fetch returns different bytes: match false, crosscheck_mismatch 1, exit 0', async () => {
 const sideKey = R + 'AAAUSDT/AAAUSDT-fundingRate-2025-05.zip.CHECKSUM';
 const r = await probe(simple({ AAAUSDT: keysOf('AAAUSDT', ['2025-05']) }, { objects: { [sideKey]: n => new Response(Buffer.from(n === 1 ? 'aaaa' : 'bbbb'), { status: 200 }) } }));
 assert.equal(r.code, 0);
 const e = table(r, 'encoding.csv');
 assert.deepEqual(e.map(x => [x.set, x.kind, x.match]), [['root_page1', 'listing', 'true'], ['zip_2504_2509', 'sidecar', 'false'], ['zip_2504_2509', 'zip', 'true']]);
 const side = e[1];
 assert.deepEqual([side.raw_bytes, side.m9_bytes, side.raw_sha256, side.m9_sha256], ['4', '4', digest('aaaa'), digest('bbbb')]);
 assert.equal(summary(r).crosscheck_mismatch, '1');
 assert.deepEqual(anomalies(r, 'crosscheck_mismatch').map(a => a.value), [sideKey]);
});

test('T32 bytes over capBytes: exit 3, only invalid.txt', async () => {
 const r = await probe(standard(), { opts: { capBytes: 100 } });
 assert.equal(r.code, 3);
 assert.deepEqual(r.files, { 'invalid.txt': 'invalid cap_bytes\n' });
 assert.equal(r.stdout, 'invalid cap_bytes\n');
 assert.deepEqual(r.urls, [ROOT_URL]);
});

test('T33 requests over capRequests: exit 3, only invalid.txt', async () => {
 const r = await probe(standard(), { opts: { capRequests: 3 } });
 assert.equal(r.code, 3);
 assert.deepEqual(r.files, { 'invalid.txt': 'invalid cap_requests\n' });
 assert.equal(r.calls.length, 3);
 assert.equal(r.stdout, 'invalid cap_requests\n');
});

test('T34 meminfo fixture: ram.csv exact; missing line and reader throwing: not_verified, exit 0', async () => {
 const end = 'MemTotal:        2000000 kB\nMemAvailable:    1400000 kB\nSwapTotal:          4096 kB\nSwapFree:            512 kB\n';
 let reads = 0;
 const a = await probe(simple({ AAAUSDT: [] }), { deps: { readMeminfo: () => (reads++ === 0 ? MEMINFO : end) } });
 assert.equal(a.files['ram.csv'], 'phase,mem_total_kb,mem_available_kb,swap_total_kb,swap_free_kb\nstart,2000000,1500000,4096,1024\nend,,1400000,,512\n');
 const b = await probe(simple({ AAAUSDT: [] }), { deps: { readMeminfo: () => 'MemTotal: 1000 kB\nMemAvailable: 900 kB\nSwapFree: 0 kB\n' } });
 assert.equal(b.files['ram.csv'], 'phase,mem_total_kb,mem_available_kb,swap_total_kb,swap_free_kb\nstart,1000,900,not_verified,0\nend,,900,,0\n');
 const c = await probe(simple({ AAAUSDT: [] }), { deps: { readMeminfo: () => { throw new Error('unreadable'); } } });
 assert.equal(c.code, 0);
 assert.equal(c.files['ram.csv'], 'phase,mem_total_kb,mem_available_kb,swap_total_kb,swap_free_kb\nstart,not_verified,not_verified,not_verified,not_verified\nend,,not_verified,,not_verified\n');
});

test('T35 checksums.sha256 correct, byte-ordered, excludes itself', async () => {
 const r = await probe(standard());
 const others = Object.keys(r.files).filter(f => f !== 'checksums.sha256').sort(bytesort);
 assert.equal(others.length, 7);
 assert.equal(r.files['checksums.sha256'], others.map(f => digest(r.files[f]) + '  ' + f + '\n').join(''));
 assert.ok(!r.files['checksums.sha256'].includes('checksums.sha256'));
});

test('T36 no output file and no stdout line contains the temporary out path or os.hostname()', async () => {
 const host = hostname();
 for (const r of [await probe(standard()), await probe(standard(), { opts: { capRequests: 3 } }), await probe(standard(), { deps: { version: 'v1.0.0' } })]) {
  const texts = [r.stdout, ...Object.values(r.files || {})];
  for (const t of texts) { assert.ok(!t.includes(r.out)); assert.ok(!t.includes(r.tmp)); assert.ok(!t.includes(tmpdir() + '/')); if (host) assert.ok(!t.includes(host)); }
 }
});

test('T37 stdout final line format for exit 0, 2 and 3', async () => {
 const ok = await probe(standard());
 assert.equal(ok.code, 0);
 assert.match(ok.stdout, /^done out\n$/);
 const stop = await probe(standard(), { deps: { version: 'v1.0.0' } });
 assert.equal(stop.code, 2);
 assert.match(stop.stdout, /^stop node v1\.0\.0\n$/);
 const bad = await probe(standard({ hook: async (u, n) => { if (u === ROOT_URL && n === 1) await globalThis.fetch('https://example.com/', {}); } }));
 assert.equal(bad.code, 3);
 assert.match(bad.stdout, /^invalid url_not_allowed\n$/);
});

test('T38 real sample: probe-4a sym-01-001.xml and sym-04-001.xml as symbol listings; listings.csv equals independent counts', async () => {
 const files = ['sym-01-001.xml', 'sym-04-001.xml'].map(f => readFileSync(join(HERE, '..', 'probe-4a', 'listing', f), 'utf8'));
 const unxml = s => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
 const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 const expected = [], lists = {}, symbols = [];
 for (const text of files) {
  const prefix = unxml(/<Prefix>([^<]*)<\/Prefix>/.exec(text)[1]), symbol = prefix.slice(R.length, -1);
  assert.ok(prefix.startsWith(R) && prefix.endsWith('/'));
  assert.match(text, /<IsTruncated>false<\/IsTruncated>/);
  lists[prefix] = [{ raw: text }];
  symbols.push(symbol);
  const keys = [...text.matchAll(/<Key>([^<]*)<\/Key>/g)].map(m => unxml(m[1]));
  const canonical = new RegExp('^' + esc(prefix + symbol) + '-fundingRate-\\d{4}-\\d{2}\\.zip(\\.CHECKSUM)?$');
  expected.push([symbol, 'ok', '1', String(keys.length), String(text.split('<CommonPrefixes>').length - 1), String(keys.filter(k => k === prefix).length),
   String(keys.filter(k => k.endsWith('/')).length), String(keys.filter(k => /[^A-Za-z0-9\-._~/]/.test(k)).length), String(keys.filter(k => !canonical.test(k)).length)]);
 }
 const r = await probe(world({ root: rootPages(symbols), lists }));
 assert.equal(r.code, 0);
 expected.sort((a, b) => bytesort(a[0], b[0]));
 assert.deepEqual(table(r, 'listings.csv').map(Object.values), expected);
 assert.equal(expected[0][0], 'ADAUSDT');
 assert.equal(expected[0][3], '162');
 assert.equal(expected[1][7], '2');
 assert.deepEqual(r.unknown, []);
});

test('T39 output over capOutput: exit 3, only invalid.txt', async () => {
 const r = await probe(standard(), { opts: { capOutput: 1000 } });
 assert.equal(r.code, 3);
 assert.deepEqual(r.files, { 'invalid.txt': 'invalid cap_output\n' });
 assert.ok(r.stdout.endsWith('\n'));
 assert.equal(r.stdout.slice(0, -1).split('\n').at(-1), 'invalid cap_output');
});

test('T40 checkOutput boundary', () => {
 // UTF-8 bytes: 'abc\n' 4, '哈x\n' 5 (the CJK character is 3 bytes); 9 in total, against a string length of 7.
 const files = { 'a.txt': 'abc\n', 'b.txt': '哈x\n' };
 assert.equal(probeR1.checkOutput(files, 9), 9);
 assert.throws(() => probeR1.checkOutput(files, 8));
});

test('T41 invalid caps: exit 2, zero requests, out not created', async () => {
 const base = { pauseMs: 0, retryMs: 0, capBytes: 134217728, capRequests: 3000, capOutput: 16777216 };
 const without = k => { const o = { ...base }; delete o[k]; return o; };
 const cases = [['capOutput missing', without('capOutput')], ['capOutput 0', { ...base, capOutput: 0 }], ['capOutput 1.5', { ...base, capOutput: 1.5 }],
  ["capOutput '16'", { ...base, capOutput: '16' }], ['capBytes missing', without('capBytes')], ['capRequests missing', without('capRequests')]];
 for (const [label, opts] of cases) {
  const w = standard(), tmp = mkdtempSync(join(tmpdir(), 'probe-r1-')), out = join(tmp, 'out');
  const previous = globalThis.fetch, lines = [], write = process.stdout.write;
  process.stdout.write = function (chunk, ...rest) { if (typeof chunk === 'string') lines.push(chunk); return write.call(this, chunk, ...rest); };
  let code;
  try {
   code = await run({ out, ...opts }, { fetch: w.fetch, version: 'v24.22.0', readMeminfo: () => MEMINFO, now: Date.now });
  } finally { process.stdout.write = write; }
  try {
   assert.equal(globalThis.fetch, previous, label + ': globalThis.fetch restored');
   assert.equal(code, 2, label);
   assert.equal(lines.join(''), 'stop cap_invalid\n', label);
   assert.equal(w.calls.length, 0, label);
   assert.ok(!existsSync(out), label + ': out not created');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
 }
});
