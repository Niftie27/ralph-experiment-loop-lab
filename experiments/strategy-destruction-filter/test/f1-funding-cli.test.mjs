// F1a-4: the funding CLI (docs/f1/f1a-4-contract.md with amendment 1, plan sections h and i). Synthetic files only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, FUNDING_HEADER } from '../src/f1-funding.mjs';
import { fundingSource, planFundingUnits, visionInstrument } from '../src/vision-source.mjs';
import { makeZip, checksumText } from '../test-support/vision-fixtures.mjs';

const HOUR = 3600000, RATE = '0.00012345';
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-funding-cli-test-'));
  return { dir, zipRoot: path.join(dir, 'data', 'vision'), args: ['--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'results', 'manifest-f1-1m.json')] };
}
const months = (from, to) => planFundingUnits('BTC').map(u => u.sources[0].zipName.slice(-11, -4)).filter((m, i, all) => all.indexOf(m) === i && m >= from && m <= to);
// Placeholder rows: every 8 h from the month start (or from `first`), calc_time 1 ms after the hour.
const csvOf = (month, { first, step = 8, h = step, rows } = {}) => {
  const start = first ?? Date.parse(`${month}-01T00:00:00Z`), end = Date.UTC(+month.slice(0, 4), +month.slice(5), 1);
  const lines = rows ?? Array.from({ length: Math.ceil((end - start) / (step * HOUR)) }, (_, i) => `${start + i * step * HOUR + 1},${h},${RATE}`);
  return Buffer.from(`${FUNDING_HEADER}\n${lines.map(l => `${l}\n`).join('')}`);
};
function publish(published, symbol, month, data = csvOf(month)) {
  const source = fundingSource(visionInstrument(symbol), month);
  const zip = makeZip([{ name: source.csvName, data }]);
  published[source.file] = zip;
  published[source.checksumFile] = Buffer.from(checksumText(zip, source.zipName));
  return source;
}
function vision(published = {}) {
  const calls = [];
  const fetch = async url => {
    calls.push(String(url));
    await new Promise(resolve => setImmediate(resolve));
    const u = new URL(String(url)), key = u.pathname.slice(1);
    if (u.origin !== 'https://data.binance.vision' || !(key in published)) return new Response('<Error>NoSuchKey</Error>', { status: 404 });
    return new Response(published[key], { status: 200, headers: { 'content-length': String(published[key].length) } });
  };
  return { fetch, calls };
}
async function run(argv, net = vision(), check) {
  let out = '';
  const code = await main(argv, { fetch: net.fetch, stdout: { write: s => { out += s; } }, sleep: async () => {}, check });
  return { code, summary: out ? JSON.parse(out) : null, out };
}
const all = (symbol, published = {}) => { for (const m of months('2021-10', '2026-09')) publish(published, symbol, m); return published; };

test('F1a-4 cli: usage errors exit 2', async () => {
  const w = workspace();
  for (const argv of [[], ['fetch'], ['download', '--symbol', 'BTC'], ['download', '--symbols', 'BTCUSDT'], ['download', '--symbols', 'BTC,BTC'], ['download', '--max-rss-mib', '1024'],
    ['download', '--max-rss-mib', '0'], ['download', '--symbols']]) {
    const r = await run([...argv, ...(argv.length ? w.args : [])]);
    assert.deepEqual([r.code, r.summary.status], [2, 'usage'], argv.join(' '));
  }
});

test('F1a-4 cli download: every planned month 2021-10..2026-09 is fetched CHECKSUM first from Vision only; a rerun skips them', async () => {
  const w = workspace(), net = vision(all('BTC'));
  const first = await run(['download', '--symbols', 'BTC', ...w.args], net);
  assert.deepEqual([first.code, first.summary.status], [0, 'ok']);
  assert.deepEqual(first.summary.counts, { expected: 60, downloaded: 60, skipped: 0, verified: 60, gaps: 0, notListed: 0, failed: 0 });
  assert.ok(net.calls.every(url => url.startsWith('https://data.binance.vision/data/futures/um/monthly/fundingRate/BTCUSDT/')));
  assert.ok(!net.calls.some(url => url.includes('2026-10') || url.includes('2021-09')));
  assert.deepEqual(net.calls.slice(0, 2).map(u => u.split('/').pop()), ['BTCUSDT-fundingRate-2021-10.zip.CHECKSUM', 'BTCUSDT-fundingRate-2021-10.zip']);
  const again = await run(['download', '--symbols', 'BTC', ...w.args], net);
  assert.deepEqual([again.code, again.summary.counts], [0, { expected: 60, downloaded: 0, skipped: 60, verified: 60, gaps: 0, notListed: 0, failed: 0 }]);
  assert.ok(!first.out.includes('bytes') && !first.out.includes(RATE));
});

test('F1a-4 cli download: HYPE months before listing are not_listed with full evidence; a later missing month is a gap (exit 3)', async () => {
  const w = workspace(), published = {};
  for (const m of months('2025-05', '2026-09')) publish(published, 'HYPE', m);
  const ok = await run(['download', '--symbols', 'HYPE', ...w.args], vision(published));
  assert.deepEqual([ok.code, ok.summary.status, ok.summary.gaps], [0, 'ok', []]);
  assert.deepEqual(ok.summary.notListed, { HYPEUSDT: months('2021-10', '2025-04') });
  assert.equal(ok.summary.notListed.HYPEUSDT.length, 43);
  const w2 = workspace(), gap = all('BTC');
  const missing = fundingSource(visionInstrument('BTC'), '2024-05');
  delete gap[missing.file]; delete gap[missing.checksumFile];
  const r = await run(['download', '--symbols', 'BTC', ...w2.args], vision(gap));
  assert.deepEqual([r.code, r.summary.status, r.summary.gaps, r.summary.notListed], [3, 'incomplete', [missing.file], {}]);
});

test('F1a-4 cli download: a republished month is stored as a second version and fails closed (exit 1)', async () => {
  const w = workspace(), published = all('BTC');
  assert.equal((await run(['download', '--symbols', 'BTC', ...w.args], vision(published))).code, 0);
  const source = publish(published, 'BTC', '2024-03', csvOf('2024-03', { rows: [`${Date.parse('2024-03-01T00:00:00Z') + 2},8,${RATE}`] }));
  const r = await run(['download', '--symbols', 'BTC', ...w.args], vision(published));
  assert.deepEqual([r.code, r.summary.status, r.summary.versionConflicts, r.summary.counts.failed, r.summary.counts.verified], [1, 'failed', [source.file], 1, 59]);
});

test('F1a-4 cli download: a memory guard trip aborts the run (exit 1)', async () => {
  const w = workspace();
  let checks = 0;
  const r = await run(['download', '--symbols', 'BTC', ...w.args], vision(all('BTC')), label => { if (++checks === 3) throw new Error(`injected trip at ${label}`); });
  assert.deepEqual([r.code, r.summary.status], [1, 'failed']);
  assert.match(r.summary.error, /injected trip at download data\/futures\/um\/monthly\/fundingRate\/BTCUSDT\/BTCUSDT-fundingRate-2021-12\.zip/);
  assert.ok(r.summary.memory.maxRssMiB > 0);
});
