// F1a-2: the Vision 1m CLI: download, verify, build, compare, exit codes and the memory guard (docs/f1/f1a-2-contract.md, A8, A10).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main } from '../src/vision-1m.mjs';
import { planUnits, visionSource } from '../src/vision-source.mjs';
import { makeZip, klineCsv, klineRow, minutes, checksumText, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const HOST = 'https://data.binance.vision/';
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-1m-cli-test-'));
  return { dir, args: ['--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'results', 'manifest-f1-1m.json')] };
}
const sourceOf = (symbol, month) => planUnits(symbol, { from: month, to: month })[0].sources[0];
// Published files: Vision path -> bytes. Responses can be overridden per URL with a list of statuses or functions.
function vision(published = {}, overrides = {}) {
  const calls = [];
  let inFlight = 0, maxInFlight = 0;
  const fetch = async (url, init = {}) => {
    calls.push(String(url));
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      await new Promise(resolve => setImmediate(resolve));
      const u = new URL(String(url)), key = u.pathname.slice(1);
      const queue = overrides[String(url)];
      const next = Array.isArray(queue) ? queue.shift() : queue;
      if (typeof next === 'function') return next(url, init);
      if (typeof next === 'number') return new Response(next >= 300 && next < 400 ? null : 'x', { status: next });
      if (u.origin !== 'https://data.binance.vision' || !(key in published)) return new Response('<Error>NoSuchKey</Error>', { status: 404 });
      return new Response(published[key], { status: 200, headers: { 'content-length': String(published[key].length) } });
    } finally { inFlight--; }
  };
  return { fetch, calls, get maxInFlight() { return maxInFlight; } };
}
function publish(published, symbol, month, openTimes) {
  const source = sourceOf(symbol, month);
  const zip = makeZip([{ name: source.csvName, data: klineCsv(openTimes) }]);
  published[source.file] = zip;
  published[`${source.file}.CHECKSUM`] = Buffer.from(checksumText(zip, source.zipName));
  return source;
}
async function run(argv, net = vision()) {
  let out = '';
  const code = await main(argv, { fetch: net.fetch, stdout: { write: s => { out += s; } }, sleep: async () => {} });
  return { code, summary: out ? JSON.parse(out) : null, out };
}
const rows = month => minutes(`${month}-02T00:00:00.000Z`, 3);
// The stored version directory of a source: the one that holds its zip (the Vision directory holds every month's).
const versionFile = (w, source) => {
  const dir = path.join(w.dir, 'data', 'vision', path.dirname(source.file));
  const [sha] = fs.readdirSync(dir).filter(n => /^[0-9a-f]{64}$/.test(n) && fs.existsSync(path.join(dir, n, source.zipName)));
  return path.join(dir, sha, source.zipName);
};

test('F1a-2 cli: usage errors exit 2 (command, flags, symbols, months, ceiling above 512 MiB)', async () => {
  const w = workspace();
  for (const argv of [[], ['fetch'], ['build', '--symbol', 'BTC'], ['build', '--symbols', 'BTCUSDT'], ['build', '--symbols', 'btc'], ['build', '--from', '2024-13'],
    ['build', '--from', '2024-03', '--to', '2024-02'], ['build', '--to', '2026-11'], ['build', '--from', '2021-09'], ['build', '--max-rss-mib', '1024'],
    ['build', '--max-rss-mib', '0'], ['build', '--symbols'], ['build', '--data-dir']]) {
    const { code, summary } = await run([...argv, ...w.args]);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(summary.status, 'usage');
  }
});

test('F1a-2 cli download: sequential HTTPS to data.binance.vision only, every file verified, already verified files skipped', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-01', rows('2024-01'));
  publish(published, 'BTC', '2024-02', rows('2024-02'));
  const net = vision(published);
  const first = await run(['download', '--symbols', 'BTC', '--from', '2024-01', '--to', '2024-02', ...w.args], net);
  assert.equal(first.code, 0);
  assert.deepEqual(first.summary.counts, { expected: 2, downloaded: 2, skipped: 0, verified: 2, gaps: 0, notListed: 0, failed: 0 });
  assert.ok(net.calls.every(url => url.startsWith(HOST)));
  assert.equal(net.maxInFlight, 1);
  // Base requests in order; each sparse month's fill days (round 5) are requested after its zip, before the next month.
  const monthly = calls => calls.filter(url => url.includes('/monthly/'));
  assert.deepEqual(monthly(net.calls), ['2024-01', '2024-02'].flatMap(m => [`${HOST}data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-${m}.zip.CHECKSUM`,
    `${HOST}data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-${m}.zip`]));
  const at = url => net.calls.indexOf(`${HOST}data/futures/um/${url}`);
  assert.ok(at('monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip') < at('daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-31.zip.CHECKSUM'));
  assert.ok(at('daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-31.zip') < at('monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-02.zip.CHECKSUM'));
  const again = vision(published);
  const second = await run(['download', '--symbols', 'BTC', '--from', '2024-01', '--to', '2024-02', ...w.args], again);
  assert.equal(second.code, 0);
  assert.deepEqual(second.summary.counts, { expected: 2, downloaded: 0, skipped: 2, verified: 2, gaps: 0, notListed: 0, failed: 0 });
  assert.ok(monthly(again.calls).every(url => url.endsWith('.CHECKSUM')));
  assert.ok(!first.out.includes(w.dir) && !first.out.includes(os.homedir()));
  assert.equal(first.summary.runtime.node, process.version);
});

test('F1a-2 cli download: 404 on both before the first file is not_listed (exit 0); after it a gap (exit 3); on one of the pair a failure (exit 1)', async () => {
  const w = workspace(), published = {};
  publish(published, 'HYPE', '2025-05', minutes('2025-05-30T07:00:00.000Z', 2));
  // The listing rule needs 404 evidence for every earlier month from the F1a range start; no file yet: all gaps.
  assert.equal((await run(['download', '--symbols', 'HYPE', '--from', '2021-10', '--to', '2025-02', ...w.args], vision(published))).code, 3);
  const listing = await run(['download', '--symbols', 'HYPE', '--from', '2025-03', '--to', '2025-05', ...w.args], vision(published));
  assert.equal(listing.code, 0);
  assert.deepEqual(listing.summary.notListed, { HYPEUSDT: ['2025-03', '2025-04'] });
  assert.equal(listing.summary.firstFiles.HYPEUSDT, 'data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-05.zip');
  const gap = await run(['download', '--symbols', 'HYPE', '--from', '2025-05', '--to', '2025-06', ...w.args], vision(published));
  assert.equal(gap.code, 3);
  assert.deepEqual(gap.summary.gaps, ['data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-06.zip']);
  const half = workspace(), onlyZip = {};
  const s = publish(onlyZip, 'ETH', '2024-01', rows('2024-01'));
  delete onlyZip[`${s.file}.CHECKSUM`];
  const noChecksum = await run(['download', '--symbols', 'ETH', '--from', '2024-01', '--to', '2024-01', ...half.args], vision(onlyZip));
  assert.equal(noChecksum.code, 1);
  assert.match(noChecksum.summary.failures[0], /CHECKSUM 404/);
  const onlyChecksum = {};
  publish(onlyChecksum, 'ETH', '2024-01', rows('2024-01'));
  delete onlyChecksum[s.file];
  assert.equal((await run(['download', '--symbols', 'ETH', '--from', '2024-01', '--to', '2024-01', ...workspace().args], vision(onlyChecksum))).code, 1);
});

test('F1a-2 cli download: finite retries with backoff for 5xx, timeouts and truncated bodies, then exit 1; a transient error recovers', async () => {
  const published = {};
  const s = publish(published, 'SOL', '2024-03', rows('2024-03'));
  const url = `${HOST}${s.file}`;
  const flaky = vision(published, { [url]: [503, 502] });
  assert.equal((await run(['download', '--symbols', 'SOL', '--from', '2024-03', '--to', '2024-03', ...workspace().args], flaky)).code, 0);
  assert.equal(flaky.calls.filter(u => u === url).length, 3);
  const down = vision(published, { [url]: [503, 503, 503, 503, 503] });
  const failed = await run(['download', '--symbols', 'SOL', '--from', '2024-03', '--to', '2024-03', ...workspace().args], down);
  assert.equal(failed.code, 1);
  assert.equal(down.calls.filter(u => u === url).length, 4);
  const timeout = () => { throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }); };
  const slow = vision(published, { [url]: [timeout, timeout, timeout, timeout] });
  assert.equal((await run(['download', '--symbols', 'SOL', '--from', '2024-03', '--to', '2024-03', ...workspace().args], slow)).code, 1);
  const short = () => new Response(published[s.file].subarray(0, 10), { status: 200, headers: { 'content-length': String(published[s.file].length) } });
  const truncated = vision(published, { [url]: [short, short, short, short] });
  const cut = await run(['download', '--symbols', 'SOL', '--from', '2024-03', '--to', '2024-03', ...workspace().args], truncated);
  assert.equal(cut.code, 1);
  assert.equal(truncated.calls.filter(u => u === url).length, 4);
  const dns = () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }); };
  assert.equal((await run(['download', '--symbols', 'SOL', '--from', '2024-03', '--to', '2024-03', ...workspace().args], vision(published, { [url]: [dns, dns, dns, dns] }))).code, 1);
});

test('F1a-2 cli download: redirects only to data.binance.vision over HTTPS; a tampered zip is never stored', async () => {
  const published = {};
  const s = publish(published, 'XRP', '2024-04', rows('2024-04'));
  const url = `${HOST}${s.file}`;
  const away = vision(published, { [url]: () => new Response(null, { status: 302, headers: { location: 'https://example.com/x.zip' } }) });
  const w = workspace();
  const refused = await run(['download', '--symbols', 'XRP', '--from', '2024-04', '--to', '2024-04', ...w.args], away);
  assert.equal(refused.code, 1);
  assert.ok(!away.calls.some(u => u.includes('example.com')));
  const plain = vision(published, { [url]: () => new Response(null, { status: 301, headers: { location: `http://data.binance.vision/${s.file}` } }) });
  assert.equal((await run(['download', '--symbols', 'XRP', '--from', '2024-04', '--to', '2024-04', ...workspace().args], plain)).code, 1);
  const moved = vision(published, { [url]: () => new Response(null, { status: 302, headers: { location: `/${s.file}?v=1` } }) });
  assert.equal((await run(['download', '--symbols', 'XRP', '--from', '2024-04', '--to', '2024-04', ...workspace().args], moved)).code, 0);
  const evil = { ...published, [s.file]: Buffer.concat([published[s.file], Buffer.from('x')]) };
  const t = workspace();
  const tampered = await run(['download', '--symbols', 'XRP', '--from', '2024-04', '--to', '2024-04', ...t.args], vision(evil));
  assert.equal(tampered.code, 1);
  assert.match(tampered.summary.failures[0], /sha256 mismatch/);
  assert.ok(!fs.existsSync(path.join(t.dir, 'data', 'vision', path.dirname(s.file))) || fs.readdirSync(path.join(t.dir, 'data', 'vision', path.dirname(s.file))).length === 0);
});

test('F1a-2 cli build, verify and compare: exit 0 ok, 3 incomplete, 1 failure; the memory guard exits 1 before any write', async () => {
  const w = workspace(), published = {};
  publish(published, 'DOGE', '2024-05', rows('2024-05'));
  publish(published, 'DOGE', '2024-06', rows('2024-06'));
  assert.equal((await run(['download', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', ...w.args], vision(published))).code, 0);
  const guarded = await run(['build', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', '--max-rss-mib', '1', ...w.args]);
  assert.equal(guarded.code, 1);
  assert.match(guarded.summary.error, /memory ceiling/);
  assert.ok(!fs.existsSync(path.join(w.dir, 'results', 'manifest-f1-1m.json')));
  assert.ok(!fs.existsSync(path.join(w.dir, 'data', 'market-cache', 'f1-1m')) || fs.readdirSync(path.join(w.dir, 'data', 'market-cache', 'f1-1m')).length === 0);
  const built = await run(['build', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', ...w.args]);
  assert.equal(built.code, 0);
  assert.equal(built.summary.counts.built, 2);
  assert.ok(built.summary.memory.maxRssMiB > 0 && built.summary.memory.ceilingMiB === 512);
  assert.equal((await run(['build', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-07', ...w.args])).code, 3);
  assert.equal((await run(['verify', ...w.args])).code, 0);
  assert.equal((await run(['compare', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', ...w.args])).code, 0);
  assert.equal((await run(['compare', '--symbols', 'DOGE', '--from', '2024-08', '--to', '2024-08', ...w.args])).code, 1);
  const file = versionFile(w, sourceOf('DOGE', '2024-05'));
  fs.chmodSync(file, 0o644); fs.appendFileSync(file, 'x');
  assert.equal((await run(['verify', ...w.args])).code, 1);
  assert.equal((await run(['compare', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', ...w.args])).code, 1);
  fs.rmSync(path.dirname(file), { recursive: true });
  const noInput = await run(['compare', '--symbols', 'DOGE', '--from', '2024-05', '--to', '2024-06', ...w.args]);
  assert.equal(noInput.code, 1);
  assert.equal(noInput.summary.missingInputs.length, 1);
});

const classes = summary => summary.units.map(u => [u.contract, u.dataStart.slice(0, 7), u.class]);

test('F1a-2 cli download: a missing or corrupt local CHECKSUM beside a verified zip is repaired, and build then succeeds', async () => {
  const w = workspace(), published = {};
  const may = publish(published, 'ETH', '2024-05', rows('2024-05')), june = publish(published, 'ETH', '2024-06', rows('2024-06'));
  const range = ['--symbols', 'ETH', '--from', '2024-05', '--to', '2024-06', ...w.args];
  assert.equal((await run(['download', ...range], vision(published))).code, 0);
  fs.rmSync(`${versionFile(w, may)}.CHECKSUM`);
  const corrupt = `${versionFile(w, june)}.CHECKSUM`;
  fs.chmodSync(corrupt, 0o644); fs.writeFileSync(corrupt, 'corrupt\n');
  assert.equal((await run(['build', ...range])).code, 1);
  const again = await run(['download', ...range], vision(published));
  assert.equal(again.code, 0);
  assert.deepEqual(again.summary.counts, { expected: 2, downloaded: 0, skipped: 2, verified: 2, gaps: 0, notListed: 0, failed: 0 });
  assert.deepEqual(again.summary.repaired, [may.checksumFile, june.checksumFile]);
  for (const source of [may, june]) assert.equal(fs.readFileSync(`${versionFile(w, source)}.CHECKSUM`, 'utf8'), published[source.checksumFile].toString());
  const built = await run(['build', ...range]);
  assert.equal(built.code, 0);
  assert.equal(built.summary.counts.built, 2);
  assert.deepEqual((await run(['download', ...range], vision(published))).summary.repaired, []);
});

test('F1a-2 cli compare: an in-scope unit absent from the reference and missing locally without recorded 404 evidence is a missing input (exit 1)', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-05', rows('2024-05'));
  assert.equal((await run(['download', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args], vision(published))).code, 0);
  assert.equal((await run(['build', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args])).code, 0);
  const compare = await run(['compare', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-06', ...w.args]);
  assert.equal(compare.code, 1);
  assert.deepEqual(classes(compare.summary), [['BTCUSDT', '2024-05', 'matched'], ['BTCUSDT', '2024-06', 'missing_input']]);
  assert.deepEqual(compare.summary.missingInputs, [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-06.zip' }]);
});

test('F1a-2 cli compare: with recorded 404 evidence after the first file it is a gap (exit 3); a reference entry without its input fails even with 404 evidence (exit 1)', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-05', rows('2024-05'));
  const range = ['--symbols', 'BTC', '--from', '2024-05', '--to', '2024-06', ...w.args];
  assert.equal((await run(['download', ...range], vision(published))).code, 3);
  assert.equal((await run(['build', ...range])).code, 3);
  const gap = await run(['compare', ...range]);
  assert.equal(gap.code, 3);
  assert.equal(gap.summary.status, 'incomplete');
  assert.deepEqual(classes(gap.summary), [['BTCUSDT', '2024-05', 'matched'], ['BTCUSDT', '2024-06', 'gap']]);
  const june = publish(published, 'BTC', '2024-06', rows('2024-06'));
  assert.equal((await run(['download', ...range], vision(published))).code, 0);
  assert.equal((await run(['build', ...range])).code, 0);
  fs.rmSync(path.dirname(versionFile(w, june)), { recursive: true });
  const lost = await run(['compare', ...range]);
  assert.equal(lost.code, 1);
  assert.deepEqual(classes(lost.summary), [['BTCUSDT', '2024-05', 'matched'], ['BTCUSDT', '2024-06', 'missing_input']]);
});

test('F1a-2 cli compare: a month before the first file with recorded 404 evidence is not_listed and does not change the exit code (exit 0)', async () => {
  const w = workspace(), published = {};
  publish(published, 'HYPE', '2025-05', minutes('2025-05-30T07:00:00.000Z', 2));
  const range = ['--symbols', 'HYPE', '--from', '2025-04', '--to', '2025-05', ...w.args];
  // The listing rule needs 404 evidence for every earlier month from the F1a range start; no file yet: all gaps.
  assert.equal((await run(['download', '--symbols', 'HYPE', '--from', '2021-10', '--to', '2025-03', ...w.args], vision(published))).code, 3);
  assert.equal((await run(['download', ...range], vision(published))).code, 0);
  assert.equal((await run(['build', ...range])).code, 0);
  const compare = await run(['compare', ...range]);
  assert.equal(compare.code, 0);
  assert.deepEqual(classes(compare.summary), [['HYPEUSDT', '2025-04', 'not_listed'], ['HYPEUSDT', '2025-05', 'matched']]);
});

test('F1a-2 cli verify and compare: the memory guard is checked between files and units and stops the run (exit 1)', async () => {
  const w = workspace(), published = {};
  publish(published, 'SOL', '2024-07', rows('2024-07'));
  publish(published, 'SOL', '2024-08', rows('2024-08'));
  const range = ['--symbols', 'SOL', '--from', '2024-07', '--to', '2024-08', ...w.args];
  assert.equal((await run(['download', ...range], vision(published))).code, 0);
  assert.equal((await run(['build', ...range])).code, 0);
  const verify = await run(['verify', '--max-rss-mib', '1', ...w.args]);
  assert.equal(verify.code, 1);
  assert.match(verify.summary.error, /memory ceiling/);
  assert.ok(verify.summary.counts.zips < 2, `verify checked ${verify.summary.counts.zips} of 2 zips`);
  const compare = await run(['compare', '--max-rss-mib', '1', ...range]);
  assert.equal(compare.code, 1);
  assert.match(compare.summary.error, /memory ceiling/);
  assert.ok(compare.summary.counts.processed < compare.summary.counts.units, JSON.stringify(compare.summary.counts));
});

// Listing rule (contract amendment 2026-10-21): not_listed needs (a)-(c) proven by recorded evidence over the F1a range.
const BTC_MONTHLY = 'data/futures/um/monthly/klines/BTCUSDT/1m';
function publishSource(published, source, openTimes) {
  const zip = makeZip([{ name: source.csvName, data: klineCsv(openTimes) }]);
  published[source.file] = zip;
  published[source.checksumFile] = Buffer.from(checksumText(zip, source.zipName));
}
// BTC answers 404 on both files for every month 2021-10..2024-05; 2024-06 is published and downloaded.
async function listedFromJune() {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-06', rows('2024-06'));
  const download = await run(['download', '--symbols', 'BTC', '--from', '2021-10', '--to', '2024-06', ...w.args], vision(published));
  return { w, published, download };
}

test('F1a-2 listing: a unit with any present source is never not_listed (2026-10 with day 16 a recorded 404): missing, a gap, exit 3', async () => {
  const w = workspace(), published = {};
  const days = planUnits('SOL', { from: '2026-10', to: '2026-10' })[0].sources;
  for (const s of days.slice(0, 15)) publishSource(published, s, minutes(new Date(s.startMs).toISOString(), 2));
  const range = ['--symbols', 'SOL', '--from', '2026-10', '--to', '2026-10', ...w.args];
  const download = await run(['download', ...range], vision(published));
  assert.equal(download.code, 3);
  assert.deepEqual([download.summary.gaps, download.summary.notListed], [[days[15].file], {}]);
  const build = await run(['build', ...range]);
  assert.equal(build.code, 3);
  const unit = { contract: 'SOLUSDT', period: 'holdout', dataStart: '2026-10-01T00:00:00.000Z', dataEnd: '2026-10-17T00:00:00.000Z' };
  assert.deepEqual(build.summary.missing, [{ ...unit, files: [{ file: days[15].file, recorded404: true }] }]);
  const [coverage] = build.summary.coverage;
  assert.deepEqual([coverage.gaps, coverage.notListed], [[{ period: 'holdout', dataStart: unit.dataStart, dataEnd: unit.dataEnd, status: 'missing' }], []]);
  assert.deepEqual(coverage.missingRanges, [{ start: unit.dataStart, end: unit.dataEnd }]);
});

test('F1a-2 listing: a 404 at --from is a gap when the earlier months carry no evidence (BTC 2024-05 missing, 2024-06 present): download, build, compare exit 3', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-06', rows('2024-06'));
  const range = ['--symbols', 'BTC', '--from', '2024-05', '--to', '2024-06', ...w.args];
  const download = await run(['download', ...range], vision(published));
  assert.equal(download.code, 3);
  assert.deepEqual([download.summary.gaps, download.summary.notListed], [[`${BTC_MONTHLY}/BTCUSDT-1m-2024-05.zip`], {}]);
  assert.equal((await run(['build', ...range])).code, 3);
  const compare = await run(['compare', ...range]);
  assert.equal(compare.code, 3);
  assert.deepEqual(classes(compare.summary), [['BTCUSDT', '2024-05', 'gap'], ['BTCUSDT', '2024-06', 'matched']]);
});

test('F1a-2 listing: with 404 evidence for every month from 2021-10, 2024-05 before the first file (2024-06) is not_listed; download, build, compare exit 0', async () => {
  const { w, download } = await listedFromJune();
  assert.equal(download.code, 0);
  assert.deepEqual([download.summary.notListed.BTCUSDT.length, download.summary.notListed.BTCUSDT.at(-1), download.summary.gaps], [32, '2024-05', []]);
  const range = ['--symbols', 'BTC', '--from', '2021-10', '--to', '2024-06', ...w.args];
  const build = await run(['build', ...range]);
  assert.equal(build.code, 0);
  assert.equal(build.summary.counts.notListed, 32);
  const compare = await run(['compare', ...range]);
  assert.equal(compare.code, 0);
  assert.deepEqual(classes(compare.summary).slice(-2), [['BTCUSDT', '2024-05', 'not_listed'], ['BTCUSDT', '2024-06', 'matched']]);
});

test('F1a-2 listing: evidence outside the selection counts: after that download, build of 2024-05 alone is not_listed (exit 0)', async () => {
  const { w } = await listedFromJune();
  const build = await run(['build', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args]);
  assert.equal(build.code, 0);
  assert.deepEqual(build.summary.counts, { units: 1, built: 0, unchanged: 0, empty: 0, missing: 0, notListed: 1, failed: 0 });
});

test('F1a-2 listing: after that download, a single-month download of 2024-05 is not_listed (exit 0)', async () => {
  const { w, published } = await listedFromJune();
  const single = await run(['download', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args], vision(published));
  assert.equal(single.code, 0);
  assert.deepEqual([single.summary.notListed, single.summary.gaps], [{ BTCUSDT: ['2024-05'] }, []]);
});

test('F1a-2 listing: the same single-month download in a store without the earlier 404 markers is a gap (exit 3)', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-06', rows('2024-06'));
  assert.equal((await run(['download', '--symbols', 'BTC', '--from', '2024-06', '--to', '2024-06', ...w.args], vision(published))).code, 0);
  const single = await run(['download', '--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args], vision(published));
  assert.equal(single.code, 3);
  assert.deepEqual([single.summary.notListed, single.summary.gaps], [{}, [`${BTC_MONTHLY}/BTCUSDT-1m-2024-05.zip`]]);
});

test('F1a-2 listing: HYPE --from 2025-01 without evidence for 2021-10..2024-12: 2025-01..04 are gaps (download and build exit 3)', async () => {
  const w = workspace(), published = {};
  publish(published, 'HYPE', '2025-05', minutes('2025-05-30T07:00:00.000Z', 2));
  const range = ['--symbols', 'HYPE', '--from', '2025-01', '--to', '2025-05', ...w.args];
  const download = await run(['download', ...range], vision(published));
  assert.equal(download.code, 3);
  assert.deepEqual([download.summary.notListed, download.summary.gaps.map(f => f.slice(-11, -4))], [{}, ['2025-01', '2025-02', '2025-03', '2025-04']]);
  const build = await run(['build', ...range]);
  assert.equal(build.code, 3);
  assert.deepEqual(build.summary.coverage[0].gaps.map(g => [g.dataStart.slice(0, 7), g.status]), [['2025-01', 'missing'], ['2025-02', 'missing'], ['2025-03', 'missing'], ['2025-04', 'missing']]);
});

test('F1a-2 listing: an instrument with no file at all keeps every recorded 404 a gap (download and build exit 3; compare: zero compared, exit 1)', async () => {
  const w = workspace();
  const range = ['--symbols', 'XRP', '--from', '2021-10', '--to', '2021-12', ...w.args];
  const download = await run(['download', ...range], vision({}));
  assert.equal(download.code, 3);
  assert.deepEqual([download.summary.counts.gaps, download.summary.counts.notListed], [3, 0]);
  const build = await run(['build', ...range]);
  assert.equal(build.code, 3);
  assert.deepEqual([build.summary.counts.missing, build.summary.counts.notListed], [3, 0]);
  const compare = await run(['compare', ...range]);
  assert.equal(compare.code, 1);
  assert.deepEqual(compare.summary.units.map(u => u.class), ['gap', 'gap', 'gap']);
});

test('F1a-2 listing: download reads the 1m manifest as evidence; a present but invalid manifest exits 1 before any request', async () => {
  const w = workspace(), published = {};
  publish(published, 'BTC', '2024-06', rows('2024-06'));
  fs.mkdirSync(path.join(w.dir, 'results'), { recursive: true });
  fs.writeFileSync(path.join(w.dir, 'results', 'manifest-f1-1m.json'), '{"entries":');
  const net = vision(published);
  const download = await run(['download', '--symbols', 'BTC', '--from', '2024-06', '--to', '2024-06', ...w.args], net);
  assert.equal(download.code, 1);
  assert.match(download.summary.error, /manifest/);
  assert.deepEqual(net.calls, []);
  assert.ok(!download.out.includes(w.dir));
});

test('F1a-2 listing: a manifest entry proves an earlier source exists after its zip is gone (download, build and compare with the reference: gap, exit 3)', async () => {
  const w = workspace(), published = {};
  const april = publish(published, 'BTC', '2024-04', rows('2024-04'));
  assert.equal((await run(['download', '--symbols', 'BTC', '--from', '2024-04', '--to', '2024-04', ...w.args], vision(published))).code, 0);
  assert.equal((await run(['build', '--symbols', 'BTC', '--from', '2024-04', '--to', '2024-04', ...w.args])).code, 0);
  fs.rmSync(path.dirname(versionFile(w, april)), { recursive: true });
  delete published[april.file]; delete published[april.checksumFile];
  publish(published, 'BTC', '2024-06', rows('2024-06'));
  const download = await run(['download', '--symbols', 'BTC', '--from', '2021-10', '--to', '2024-06', ...w.args], vision(published));
  assert.equal(download.code, 3);
  assert.deepEqual([download.summary.notListed.BTCUSDT.length, download.summary.gaps], [30, [`${BTC_MONTHLY}/BTCUSDT-1m-2024-04.zip`, `${BTC_MONTHLY}/BTCUSDT-1m-2024-05.zip`]]);
  const range = ['--symbols', 'BTC', '--from', '2024-05', '--to', '2024-06', ...w.args];
  assert.equal((await run(['build', ...range])).code, 3);
  const compare = await run(['compare', ...range]);
  assert.equal(compare.code, 3);
  assert.deepEqual(classes(compare.summary), [['BTCUSDT', '2024-05', 'gap'], ['BTCUSDT', '2024-06', 'matched']]);
});

// Round 3: a later local version counts for (c) only after the build's own check (CHECKSUM, zip sha256, directory name).
function damageJune(w, damage) {
  const june = versionFile(w, sourceOf('BTC', '2024-06'));
  if (damage === 'zip bytes') { fs.chmodSync(june, 0o644); const b = fs.readFileSync(june); b[b.length - 30] ^= 1; fs.writeFileSync(june, b); }
  if (damage === 'CHECKSUM removed') fs.rmSync(`${june}.CHECKSUM`);
  if (damage === 'another 64-hex directory') fs.renameSync(path.dirname(june), path.join(path.dirname(path.dirname(june)), 'f'.repeat(64)));
}
const mayOnly = w => ['--symbols', 'BTC', '--from', '2024-05', '--to', '2024-05', ...w.args];

for (const damage of ['zip bytes', 'CHECKSUM removed', 'another 64-hex directory']) {
  test(`F1a-2 listing: a later local version that fails the build check (${damage}) is no evidence for (c): build of 2024-05 is a gap (exit 3)`, async () => {
    const { w } = await listedFromJune();
    damageJune(w, damage);
    const build = await run(['build', ...mayOnly(w)]);
    assert.equal(build.code, 3);
    assert.deepEqual([build.summary.counts.missing, build.summary.counts.notListed], [1, 0]);
  });
}

test('F1a-2 listing: a corrupt later version with a manifest entry for that source still proves (c): build of 2024-05 is not_listed (exit 0)', async () => {
  const { w } = await listedFromJune();
  assert.equal((await run(['build', '--symbols', 'BTC', '--from', '2021-10', '--to', '2024-06', ...w.args])).code, 0);
  damageJune(w, 'zip bytes');
  const build = await run(['build', ...mayOnly(w)]);
  assert.equal(build.code, 0);
  assert.deepEqual([build.summary.counts.missing, build.summary.counts.notListed], [0, 1]);
});

test('F1a-2 listing: a single-month download of 2024-05 with a corrupt later version and no manifest entry is a gap (exit 3)', async () => {
  const { w, published } = await listedFromJune();
  damageJune(w, 'zip bytes');
  const single = await run(['download', ...mayOnly(w)], vision(published));
  assert.equal(single.code, 3);
  assert.deepEqual([single.summary.notListed, single.summary.gaps], [{}, [`${BTC_MONTHLY}/BTCUSDT-1m-2024-05.zip`]]);
});

// Daily fill in download (contract amendment round 5, F2, F3, F7; plan approval points 1, 2, 5 and 9).
const DAILY = 'data/futures/um/daily/klines';
const dayOf = (symbol, day) => visionSource(planUnits(symbol, { from: day.slice(0, 7), to: day.slice(0, 7) })[0].instrument, 'daily', Date.parse(`${day}T00:00:00.000Z`));
function publishCsv(published, source, csv) {
  const zip = makeZip([{ name: source.csvName, data: csv }]);
  published[source.file] = zip;
  published[source.checksumFile] = Buffer.from(checksumText(zip, source.zipName));
  return source;
}
const JANUARY = Array.from({ length: 31 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);
const btcDay = day => `${DAILY}/BTCUSDT/1m/BTCUSDT-1m-${day}.zip`;
function invariants(counts) {
  assert.equal(counts.verified, counts.downloaded + counts.skipped);
  assert.equal(counts.verified + counts.gaps + counts.notListed + counts.failed, counts.expected);
}
async function runWith(argv, net, check) {
  let out = '';
  const code = await main(argv, { fetch: net.fetch, stdout: { write: s => { out += s; } }, sleep: async () => {}, check });
  return { code, summary: JSON.parse(out) };
}
// BTC 2024-01 with 3 rows on 01-02 (every January day lacks minutes) and the daily file of 01-02 published.
function sparseJanuary() {
  const published = {};
  const month = publish(published, 'BTC', '2024-01', rows('2024-01'));
  const day2 = publishCsv(published, dayOf('BTC', '2024-01-02'), klineCsv(minutes('2024-01-02T00:00:00.000Z', 5)));
  return { published, month, day2, range: ['--symbols', 'BTC', '--from', '2024-01', '--to', '2024-01'] };
}

test('F1a-2 r5 cli download: a verified monthly file is parsed and its fill days fetched, CHECKSUM first; a 404 pair is fill unavailable (exit 0), not a gap, not listing evidence', async () => {
  const w = workspace(), { published, day2, range } = sparseJanuary();
  const net = vision(published);
  const first = await run(['download', ...range, ...w.args], net);
  assert.equal(first.code, 0);
  assert.deepEqual(first.summary.counts, { expected: 1, downloaded: 1, skipped: 0, verified: 1, gaps: 0, notListed: 0, failed: 0 });
  assert.deepEqual(first.summary.fills.counts, { expected: 31, downloaded: 1, skipped: 0, verified: 1, unavailable: 30, failed: 0, monthlyParseFailed: 0 });
  const unavailable = JANUARY.filter(d => d !== '2024-01-02').map(btcDay);
  assert.deepEqual(first.summary.fills.unavailable, unavailable);
  assert.deepEqual([first.summary.gaps, first.summary.notListed, first.summary.failures], [[], {}, []]);
  // CHECKSUM first; the zip after a CHECKSUM 404 (probe) and after a CHECKSUM 200 (fetch); all after the monthly zip.
  assert.deepEqual(net.calls.filter(u => u.includes('/daily/')), JANUARY.flatMap(d => [`${HOST}${btcDay(d)}.CHECKSUM`, `${HOST}${btcDay(d)}`]));
  assert.ok(net.calls.indexOf(`${HOST}${btcDay('2024-01-01')}.CHECKSUM`) > net.calls.indexOf(`${HOST}${sourceOf('BTC', '2024-01').file}`));
  assert.ok(fs.existsSync(versionFile(w, day2)));
  assert.deepEqual(fs.readdirSync(path.join(w.dir, 'data', 'vision', DAILY, 'BTCUSDT', '1m', '404')).sort(), unavailable.map(f => path.basename(f)));
});

test('F1a-2 r5 cli download: fills are derived on the cache-hit path too; unavailable fills are probed again on a rerun', async () => {
  const w = workspace(), { published, range } = sparseJanuary();
  assert.equal((await run(['download', ...range, ...w.args], vision(published))).code, 0);
  const again = vision(published);
  const second = await run(['download', ...range, ...w.args], again);
  assert.equal(second.code, 0);
  assert.deepEqual(second.summary.counts, { expected: 1, downloaded: 0, skipped: 1, verified: 1, gaps: 0, notListed: 0, failed: 0 });
  assert.deepEqual(second.summary.fills.counts, { expected: 31, downloaded: 0, skipped: 1, verified: 1, unavailable: 30, failed: 0, monthlyParseFailed: 0 });
  const daily = again.calls.filter(u => u.includes('/daily/'));
  assert.ok(daily.includes(`${HOST}${btcDay('2024-01-31')}.CHECKSUM`) && daily.includes(`${HOST}${btcDay('2024-01-31')}`));
  assert.ok(daily.includes(`${HOST}${btcDay('2024-01-02')}.CHECKSUM`) && !daily.includes(`${HOST}${btcDay('2024-01-02')}`));
  // A day published since the first run is fetched now.
  publishCsv(published, dayOf('BTC', '2024-01-31'), klineCsv(minutes('2024-01-31T00:00:00.000Z', 2)));
  const third = await run(['download', ...range, ...w.args], vision(published));
  assert.deepEqual([third.code, third.summary.fills.counts.downloaded, third.summary.fills.counts.unavailable], [0, 1, 29]);
});

test('F1a-2 r5 cli download: a fill 404 on one of the pair or a failing fill exits 1, also with every base file ok or with a base gap; base counts keep both invariants', async () => {
  for (const [name, damage, pattern] of [['zip without CHECKSUM', (p, d) => delete p[d.checksumFile], /CHECKSUM 404 but the zip exists/],
    ['CHECKSUM without zip', (p, d) => delete p[d.file], /zip 404 but the CHECKSUM exists/]]) {
    const w = workspace(), { published, day2, range } = sparseJanuary();
    damage(published, day2);
    const r = await run(['download', ...range, ...w.args], vision(published));
    assert.equal(r.code, 1, name);
    assert.equal(r.summary.status, 'failed', name);
    assert.deepEqual([r.summary.counts.failed, r.summary.fills.counts.failed, r.summary.fills.counts.unavailable], [0, 1, 30], name);
    assert.match(r.summary.failures.join('\n'), pattern, name);
    invariants(r.summary.counts);
  }
  // A fill failing after the retries next to a base gap (2024-02: 404 on both): failure 1 outranks incomplete 3.
  const w = workspace(), { published, day2 } = sparseJanuary();
  const net = vision(published, { [`${HOST}${day2.file}`]: [503, 503, 503, 503] });
  const r = await run(['download', '--symbols', 'BTC', '--from', '2024-01', '--to', '2024-02', ...w.args], net);
  assert.equal(r.code, 1);
  assert.deepEqual([r.summary.counts.gaps, r.summary.counts.failed, r.summary.fills.counts.failed], [1, 0, 1]);
  assert.match(r.summary.failures.join('\n'), /BTCUSDT-1m-2024-01-02\.zip: HTTP 503 after 4 attempts/);
  invariants(r.summary.counts);
});

test('F1a-2 r5 cli download: a monthly file failing parsing or the quarantine cap exits 1 on fresh and cached bytes, stays verified, counts as monthlyParseFailed; holdout diagnostics carry times, never values', async () => {
  const w = workspace(), published = {};
  const prices = { open: '187.4321', high: '187.1234', low: '186.9876', close: '187.0001' };
  const t = minutes('2026-01-05T00:00:00.000Z', 11);
  publishCsv(published, sourceOf('SOL', '2026-01'), KLINE_HEADER + '\n' + t.map(x => klineRow(x, prices)).join('\n') + '\n');
  const u = Date.parse('2026-02-05T00:00:00.000Z');
  publishCsv(published, sourceOf('SOL', '2026-02'), KLINE_HEADER + '\n' + klineRow(u, { ...prices, closeTime: String(u + 1) }) + '\n');
  const range = ['--symbols', 'SOL', '--from', '2026-01', '--to', '2026-02', ...w.args];
  for (const [pass, transport] of [['fresh', { downloaded: 2, skipped: 0 }], ['cached', { downloaded: 0, skipped: 2 }]]) {
    const net = vision(published);
    const r = await runWith(['download', ...range], net);
    assert.equal(r.code, 1, pass);
    assert.deepEqual(r.summary.counts, { expected: 2, ...transport, verified: 2, gaps: 0, notListed: 0, failed: 0 }, pass);
    invariants(r.summary.counts);
    assert.deepEqual(r.summary.fills.counts, { expected: 0, downloaded: 0, skipped: 0, verified: 0, unavailable: 0, failed: 0, monthlyParseFailed: 2 }, pass);
    const failures = r.summary.failures.join('\n');
    assert.match(failures, /SOLUSDT-1m-2026-01\.zip: Vision klines: row 11 \(2026-01-05T00:10:00\.000Z\): more than 10 quarantined rows in this file/, pass);
    assert.match(failures, /SOLUSDT-1m-2026-02\.zip: Vision klines: row 1 \(2026-02-05T00:00:00\.000Z\): close_time/, pass);
    assert.ok(!net.calls.some(url => url.includes('/daily/')), pass);
    assert.doesNotMatch(JSON.stringify(r.summary), /187\.|186\./, pass);
  }
});

test('F1a-2 r5 cli download: firstFiles names base sources only; fill files never appear in gaps or notListed', async () => {
  const w = workspace(), published = {};
  publish(published, 'HYPE', '2025-05', minutes('2025-05-30T10:30:00.000Z', 2));
  publishCsv(published, dayOf('HYPE', '2025-05-30'), klineCsv(minutes('2025-05-30T10:30:00.000Z', 2)));
  const r = await run(['download', '--symbols', 'HYPE', '--from', '2021-10', '--to', '2025-05', ...w.args], vision(published));
  assert.equal(r.code, 0);
  assert.equal(r.summary.firstFiles.HYPEUSDT, 'data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-05.zip');
  assert.deepEqual([r.summary.gaps, r.summary.notListed.HYPEUSDT.length, r.summary.notListed.HYPEUSDT.at(-1)], [[], 43, '2025-04']);
  assert.deepEqual(r.summary.fills.counts, { expected: 31, downloaded: 1, skipped: 0, verified: 1, unavailable: 30, failed: 0, monthlyParseFailed: 0 });
  assert.ok(!JSON.stringify([r.summary.gaps, r.summary.notListed, r.summary.firstFiles]).includes('/daily/'));
});

test('F1a-2 r5 cli download: an injected memory guard trip before a monthly parse, after it or before a fill fetch aborts the run before any further request (exit 1)', async () => {
  const published = {};
  const jan = publish(published, 'BTC', '2024-01', rows('2024-01'));
  publish(published, 'BTC', '2024-02', rows('2024-02'));
  for (const label of [`parse ${jan.file}`, `parsed ${jan.file}`, `fill ${btcDay('2024-01-05')}`]) {
    const net = vision(published);
    const r = await runWith(['download', '--symbols', 'BTC', '--from', '2024-01', '--to', '2024-02', ...workspace().args], net,
      l => { if (l === label) throw new Error('memory ceiling exceeded: injected'); });
    assert.equal(r.code, 1, label);
    assert.match(r.summary.error, /memory ceiling exceeded: injected/, label);
    assert.ok(!net.calls.some(url => url.includes('2024-02') || url.includes('2024-01-05') || url.includes('2024-01-06')), label);
    assert.equal(net.calls.some(url => url.includes('2024-01-04')), label.startsWith('fill'), label);
  }
});

// verify and compare reports (contract amendment round 5, Q5 and F8; plan approval points 6 and 9).
test('F1a-2 r5 cli: a holdout month with a filled gap and a quarantined row: download, build, verify and compare exit 0, report quarantine and daily fill per symbol, and print no values', async () => {
  const w = workspace(), published = {};
  const valid = { open: '187.4321', high: '187.9999', low: '186.9876', close: '187.0001' }, quarantined = { ...valid, high: '187.1234' };
  const t = minutes('2026-01-05T00:00:00.000Z', 4);
  const month = publishCsv(published, sourceOf('SOL', '2026-01'), KLINE_HEADER + '\n' + [klineRow(t[0], valid), klineRow(t[1], quarantined), klineRow(t[3], valid)].join('\n') + '\n');
  const day5 = publishCsv(published, dayOf('SOL', '2026-01-05'), KLINE_HEADER + '\n' + [klineRow(t[0], valid), klineRow(t[2], valid), klineRow(t[3], valid)].join('\n') + '\n');
  const range = ['--symbols', 'SOL', '--from', '2026-01', '--to', '2026-01', ...w.args];
  const outputs = [];
  for (const command of ['download', 'build', 'verify', 'compare']) {
    const r = await run([command, ...range], vision(published));
    assert.equal(r.code, 0, `${command}: ${r.out}`);
    outputs.push(r);
  }
  const [, build, verify, compare] = outputs.map(r => r.summary);
  const record = { file: month.file, openTime: '2026-01-05T00:01:00.000Z', rule: 'high below max(open, close)' };
  const unavailable = Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`).filter(d => d !== '2026-01-05').map(d => `${DAILY}/SOLUSDT/1m/SOLUSDT-1m-${d}.zip`);
  for (const summary of [build, compare]) {
    assert.deepEqual(summary.coverage[0].quarantine, { sourceRows: 1, uniqueMinutes: 1, rows: [record] });
    assert.deepEqual(summary.coverage[0].dailyFill, { filledMinutes: 1, sources: [day5.file], unavailable });
  }
  assert.deepEqual(verify.coverage[0].quarantine, { sourceRows: 1, uniqueMinutes: 1, rows: [record] });
  assert.deepEqual(verify.coverage[0].dailyFill, { filledMinutes: 1, sources: [day5.file], unavailableAtBuild: unavailable });
  assert.match(verify.reportScope, /empty, missing and failed units are not represented/);
  assert.deepEqual(verify.counts, { zips: 2, entries: 1, orphans: 0, sources: 2 });
  for (const r of outputs) assert.doesNotMatch(r.out, /187\.|186\./);
});

test('F1a-2 r5 cli verify: unavailableAtBuild is the state recorded in the entry, not current availability: a daily stored since stays listed', async () => {
  const w = workspace(), { published, range } = sparseJanuary();
  const args = [...range, ...w.args];
  assert.equal((await run(['download', ...args], vision(published))).code, 0);
  assert.equal((await run(['build', ...args])).code, 0);
  publishCsv(published, dayOf('BTC', '2024-01-31'), klineCsv(minutes('2024-01-31T00:00:00.000Z', 2)));
  assert.equal((await run(['download', ...args], vision(published))).summary.fills.counts.downloaded, 1);
  const verify = await run(['verify', ...w.args]);
  assert.equal(verify.code, 0);
  assert.equal(verify.summary.counts.zips, 3);
  assert.ok(verify.summary.coverage[0].dailyFill.unavailableAtBuild.includes(btcDay('2024-01-31')));
  assert.deepEqual(verify.summary.coverage[0].dailyFill.sources, [btcDay('2024-01-02')]);
});
