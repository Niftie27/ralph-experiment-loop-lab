// F1a-3 commit 6: the reference plan and download (docs/f1/f1a-3-contract.md C3, V3; plan sections d, h, j).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, planReferences, assertResearchSource, FILLED_DAYS } from '../src/f1-reference.mjs';
import { visionSource, gridOpen, KLINE_INTERVALS } from '../src/vision-source.mjs';
import { makeZip, klineCsv, checksumText } from '../test-support/vision-fixtures.mjs';

const HOST = 'https://data.binance.vision/';
const BTC = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const ms = s => Date.parse(s);
const count = (sources, interval, kind) => sources.filter(s => s.interval === interval && s.kind === kind).length;
const labels = (sources, interval, kind) => sources.filter(s => s.interval === interval && s.kind === kind).map(s => s.zipName.replace(/^.*-(\d{4}-\d\d(-\d\d)?)\.zip$/, '$1'));

test('reference plan: 1h, 4h and 1d monthly to 2025-09 plus daily 2025-10-01..16, 1w monthly to 2024-01, 5m and 15m in the C3 month', () => {
  const btc = planReferences('BTC');
  for (const interval of ['1h', '4h', '1d']) {
    assert.equal(count(btc, interval, 'monthly'), 48);
    assert.deepEqual(labels(btc, interval, 'monthly').slice(0, 2), ['2021-10', '2021-11']);
    assert.equal(labels(btc, interval, 'monthly').at(-1), '2025-09');
    assert.deepEqual(labels(btc, interval, 'daily'), Array.from({ length: 16 }, (_, i) => `2025-10-${String(i + 1).padStart(2, '0')}`));
  }
  assert.deepEqual([count(btc, '1w', 'monthly'), count(btc, '1w', 'daily')], [28, 0]);
  assert.deepEqual([labels(btc, '1w', 'monthly')[0], labels(btc, '1w', 'monthly').at(-1)], ['2021-10', '2024-01']);
  assert.deepEqual([labels(btc, '5m', 'monthly'), labels(btc, '15m', 'monthly')], [['2022-06'], ['2022-06']]);
  assert.equal(btc.length, 48 * 3 + 16 * 3 + 28 + 2);
  assert.equal(btc[0].file, 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2021-10.zip');
  assert.ok(btc.some(s => s.file === 'data/futures/um/daily/klines/BTCUSDT/1d/BTCUSDT-1d-2025-10-16.zip'));
  assert.ok(btc.every(s => s.symbol === 'BTC' && Object.hasOwn(KLINE_INTERVALS, s.interval)));
  assert.deepEqual(btc.filter(s => s.interval === '1h' || s.interval === '4h').map(s => s.role), Array(128).fill('deciding'));
  assert.deepEqual([...new Set(btc.filter(s => ['1d', '1w'].includes(s.interval)).map(s => s.role))], ['reported']);
  assert.deepEqual([...new Set(btc.filter(s => ['5m', '15m'].includes(s.interval)).map(s => s.role))], ['c3']);
  const hype = planReferences('HYPE');
  assert.deepEqual([count(hype, '1h', 'monthly'), count(hype, '1h', 'daily'), count(hype, '1w', 'monthly')], [5, 16, 0]);
  assert.equal(labels(hype, '1h', 'monthly')[0], '2025-05');
  assert.deepEqual(labels(hype, '5m', 'monthly'), ['2025-08']);
  const months = { ETH: '2023-03', SOL: '2022-02', XRP: '2023-11', DOGE: '2024-05' };
  for (const [symbol, month] of Object.entries(months)) assert.deepEqual(labels(planReferences(symbol), '15m', 'monthly'), [month]);
  assert.throws(() => planReferences('BTCUSDT'), /Unknown symbol/);
});

// Amendment 1 D2: the days the 1m store fills from daily files get daily reference files of their own.
const FILLS = ['2022-02-26', '2022-02-27', '2022-02-28', '2022-04-01', '2022-04-02'];
test('reference plan D2: daily 1h, 4h and 1d files of the filled days, daily 5m and 15m files of those in the C3 month', () => {
  assert.deepEqual(FILLED_DAYS, { SOL: FILLS, XRP: FILLS });
  const sol = planReferences('SOL'), xrp = planReferences('XRP');
  const filled = (sources, interval) => labels(sources, interval, 'daily').filter(day => day < '2025-10-01');
  for (const interval of ['1h', '4h', '1d']) {
    assert.deepEqual([filled(sol, interval), filled(xrp, interval)], [FILLS, FILLS], interval);
    assert.equal(count(sol, interval, 'monthly'), 48);
  }
  assert.deepEqual([labels(sol, '5m', 'daily'), labels(sol, '15m', 'daily')], [FILLS.slice(0, 3), FILLS.slice(0, 3)]);
  assert.deepEqual([count(xrp, '5m', 'daily'), count(xrp, '15m', 'daily')], [0, 0]);
  assert.deepEqual([sol.length, xrp.length], [222 + 15 + 6, 222 + 15]);
  assert.deepEqual(['BTC', 'ETH', 'DOGE', 'HYPE'].map(symbol => planReferences(symbol).length), [222, 222, 222, 65]);
  const role = (sources, interval, day) => sources.find(s => s.interval === interval && s.kind === 'daily' && s.zipName.endsWith(`${day}.zip`)).role;
  assert.deepEqual(['1h', '4h', '1d', '5m', '15m'].map(interval => role(sol, interval, '2022-02-27')), ['deciding', 'deciding', 'reported', 'c3', 'c3']);
  assert.ok(sol.some(s => s.file === 'data/futures/um/daily/klines/SOLUSDT/4h/SOLUSDT-4h-2022-04-02.zip'));
  // Each file once; within an interval in time order (a daily file after the monthly file of its month).
  for (const sources of [sol, xrp]) {
    assert.equal(new Set(sources.map(s => s.file)).size, sources.length);
    for (const interval of Object.keys(KLINE_INTERVALS).filter(i => i !== '1m')) {
      const starts = sources.filter(s => s.interval === interval).map(s => s.startMs);
      assert.deepEqual(starts, [...starts].sort((a, b) => a - b), interval);
    }
  }
  assert.deepEqual(sol.filter(s => s.interval === '1h').map(s => s.zipName).slice(4, 9),
    ['SOLUSDT-1h-2022-02.zip', 'SOLUSDT-1h-2022-02-26.zip', 'SOLUSDT-1h-2022-02-27.zip', 'SOLUSDT-1h-2022-02-28.zip', 'SOLUSDT-1h-2022-03.zip']);
});

test('reference plan D2: FILLED_DAYS are exactly the whole days of the research filledRanges in the committed 1m manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../results/manifest-f1-1m.json', import.meta.url), 'utf8'));
  const days = {};
  for (const e of manifest.entries) if (e.period === 'research') for (const r of e.filledRanges) {
    assert.deepEqual([ms(r.start) % 86400000, ms(r.end) % 86400000], [0, 0], `${e.contract} ${r.start}`);
    for (let t = ms(r.start); t < ms(r.end); t += 86400000) (days[e.contract.replace(/USDT$/, '')] ??= []).push(new Date(t).toISOString().slice(0, 10));
  }
  assert.deepEqual(days, FILLED_DAYS);
});

test('reference plan holdout guard: no monthly 2025-10 or later, no daily from 2025-10-17, no row that can close after 2025-10-17', () => {
  for (const symbol of ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'HYPE']) for (const s of planReferences(symbol)) {
    assert.ok(s.kind === 'daily' ? s.startMs < ms('2025-10-17T00:00:00.000Z') : s.endMs <= ms('2025-10-01T00:00:00.000Z'), s.file);
    assert.doesNotThrow(() => assertResearchSource(s));
  }
  const refuse = (kind, iso, interval) => assert.throws(() => assertResearchSource({ ...visionSource(BTC, kind, ms(iso), interval), interval }), /holdout/);
  refuse('monthly', '2025-10-01T00:00:00.000Z', '1h');
  refuse('daily', '2025-10-17T00:00:00.000Z', '1h');
  refuse('daily', '2026-01-05T00:00:00.000Z', '1d');
  refuse('monthly', '2025-10-01T00:00:00.000Z', '1w');
  assert.doesNotThrow(() => assertResearchSource({ ...visionSource(BTC, 'daily', ms('2025-10-16T00:00:00.000Z'), '1d'), interval: '1d' }));
  assert.doesNotThrow(() => assertResearchSource({ ...visionSource(BTC, 'monthly', ms('2025-09-01T00:00:00.000Z'), '1w'), interval: '1w' }));
});

// Published files: Vision path -> bytes; everything else answers 404. Every call is recorded.
function vision(published) {
  const calls = [];
  let inFlight = 0, maxInFlight = 0;
  const fetch = async url => {
    calls.push(String(url));
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      await new Promise(resolve => setImmediate(resolve));
      const u = new URL(String(url)), key = u.pathname.slice(1);
      if (u.origin !== 'https://data.binance.vision' || !(key in published)) return new Response('<Error>NoSuchKey</Error>', { status: 404 });
      return new Response(published[key], { status: 200, headers: { 'content-length': String(published[key].length) } });
    } finally { inFlight--; }
  };
  return { fetch, calls, get maxInFlight() { return maxInFlight; } };
}
// Publishes every planned reference file of the symbols (one row each) except the skipped files.
function publishAll(symbols, skip = []) {
  const published = {};
  for (const symbol of symbols) for (const s of planReferences(symbol)) {
    if (skip.includes(s.file)) continue;
    const step = KLINE_INTERVALS[s.interval], grid = gridOpen(s.interval, s.startMs), open = grid < s.startMs ? grid + step : grid;
    const zip = makeZip([{ name: s.csvName, data: klineCsv([open], { over: { [open]: { closeTime: String(open + step - 1) } } }) }]);
    published[s.file] = zip;
    published[`${s.file}.CHECKSUM`] = Buffer.from(checksumText(zip, s.zipName));
  }
  return published;
}
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-reference-test-'));
  return { dir, args: ['--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'results', 'manifest-f1-1m.json')] };
}
async function run(argv, net = vision({})) {
  let out = '';
  const code = await main(argv, { fetch: net.fetch, stdout: { write: s => { out += s; } }, sleep: async () => {} });
  return { code, summary: out ? JSON.parse(out) : null, out };
}

test('reference download: every planned file through the verified transport, CHECKSUM first, stored by version; a rerun skips', async () => {
  const w = workspace(), published = publishAll(['HYPE']), net = vision(published);
  const first = await run(['download', '--symbols', 'HYPE', ...w.args], net);
  assert.equal(first.code, 0, JSON.stringify(first.summary));
  assert.equal(first.summary.status, 'ok');
  assert.deepEqual(first.summary.counts['1h'], { expected: 21, downloaded: 21, skipped: 0, verified: 21, missing: 0, failed: 0 });
  assert.deepEqual(first.summary.counts['1w'], { expected: 0, downloaded: 0, skipped: 0, verified: 0, missing: 0, failed: 0 });
  assert.deepEqual(first.summary.counts['5m'], { expected: 1, downloaded: 1, skipped: 0, verified: 1, missing: 0, failed: 0 });
  assert.equal(net.calls.length, 2 * 65);
  assert.ok(net.calls.every(url => url.startsWith(HOST)));
  assert.equal(net.maxInFlight, 1);
  assert.ok(net.calls.indexOf(`${HOST}data/futures/um/monthly/klines/HYPEUSDT/1h/HYPEUSDT-1h-2025-05.zip.CHECKSUM`) < net.calls.indexOf(`${HOST}data/futures/um/monthly/klines/HYPEUSDT/1h/HYPEUSDT-1h-2025-05.zip`));
  assert.ok(!net.calls.some(url => /-2025-1[0-2]\.zip|-2025-10-(1[7-9]|2\d|3[01])\.zip|-2026-/.test(url)), 'no holdout file is requested');
  const stored = path.join(w.dir, 'data', 'vision', 'data/futures/um/daily/klines/HYPEUSDT/4h');
  assert.equal(fs.readdirSync(stored).filter(n => /^[0-9a-f]{64}$/.test(n)).length, 16);
  const again = vision(published);
  const second = await run(['download', '--symbols', 'HYPE', ...w.args], again);
  assert.equal(second.code, 0);
  assert.deepEqual(second.summary.counts['1h'], { expected: 21, downloaded: 0, skipped: 21, verified: 21, missing: 0, failed: 0 });
  assert.ok(again.calls.every(url => url.endsWith('.CHECKSUM')));
  assert.ok(!first.out.includes(w.dir) && !first.out.includes(os.homedir()));
  assert.equal(first.summary.runtime.node, process.version);
});

test('reference download: a missing 1d, 1w, 5m or 15m file is reported (exit 0); a missing 1h or 4h file exits 3; a bad file exits 1', async () => {
  const reported = ['data/futures/um/daily/klines/HYPEUSDT/1d/HYPEUSDT-1d-2025-10-05.zip', 'data/futures/um/monthly/klines/HYPEUSDT/15m/HYPEUSDT-15m-2025-08.zip'];
  const ok = await run(['download', '--symbols', 'HYPE', ...workspace().args], vision(publishAll(['HYPE'], reported)));
  assert.equal(ok.code, 0);
  assert.deepEqual(ok.summary.missing, reported.map(file => ({ file, interval: file.includes('/1d/') ? '1d' : '15m', role: file.includes('/1d/') ? 'reported' : 'c3' })));
  assert.deepEqual(ok.summary.counts['1d'], { expected: 21, downloaded: 20, skipped: 0, verified: 20, missing: 1, failed: 0 });
  const deciding = 'data/futures/um/daily/klines/HYPEUSDT/4h/HYPEUSDT-4h-2025-10-16.zip';
  const incomplete = await run(['download', '--symbols', 'HYPE', ...workspace().args], vision(publishAll(['HYPE'], [deciding])));
  assert.equal(incomplete.code, 3);
  assert.equal(incomplete.summary.status, 'incomplete');
  assert.deepEqual(incomplete.summary.missing, [{ file: deciding, interval: '4h', role: 'deciding' }]);
  const bad = publishAll(['HYPE']);
  const file = 'data/futures/um/monthly/klines/HYPEUSDT/1h/HYPEUSDT-1h-2025-06.zip';
  bad[`${file}.CHECKSUM`] = Buffer.from(`${'0'.repeat(64)}  HYPEUSDT-1h-2025-06.zip\n`);
  const failed = await run(['download', '--symbols', 'HYPE', ...workspace().args], vision(bad));
  assert.equal(failed.code, 1);
  assert.equal(failed.summary.status, 'failed');
  assert.match(failed.summary.failures[0], /HYPEUSDT-1h-2025-06\.zip.*sha256 mismatch/);
  assert.equal(failed.summary.counts['1h'].failed, 1);
});

test('reference cli: usage errors exit 2', async () => {
  const w = workspace();
  for (const argv of [[], ['fetch'], ['download', '--symbol', 'BTC'], ['download', '--symbols', 'BTCUSDT'], ['download', '--symbols', 'BTC,BTC'],
    ['download', '--max-rss-mib', '1024'], ['download', '--max-rss-mib', '0'], ['download', '--symbols'], ['download', '--from', '2024-01']]) {
    const { code, summary } = await run([...argv, ...w.args]);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(summary.status, 'usage');
  }
});
