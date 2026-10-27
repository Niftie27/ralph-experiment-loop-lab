// F1a-3 commit 7: the reference compare (docs/f1/f1a-3-contract.md V1, V3, V4, approval 5(a); plan sections i, j).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, compareInterval, planReferences } from '../src/f1-reference.mjs';
import { aggregateResearch } from '../src/f1-aggregate.mjs';
import { storeSource, buildStore } from '../src/f1-1m-store.mjs';
import { planUnits, visionSource, KLINE_INTERVALS } from '../src/vision-source.mjs';
import { makeZip, klineCsv, klineRow, minutes, checksumText, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const BTC = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const HYPE = { exchange: 'binance', market: 'linear_perpetual', contract: 'HYPEUSDT' };
const MIN = 60000, H = 3600000, D = 86400000;
const ms = s => Date.parse(s);
const iso = t => new Date(t).toISOString();
// The 1m tokens of every fixture minute (klineRow defaults) and their n-minute sums as written by Vision.
const MINUTE = { open: '42314.00', high: '42335.80', low: '42289.60', close: '42331.90', volume: '289.641', quoteVolume: '12256155.25625', count: '3310',
  takerBuyVolume: '175.211', takerBuyQuoteVolume: '7414459.86355' };
const times = (token, n) => {
  const scale = token.includes('.') ? token.length - token.indexOf('.') - 1 : 0, s = (BigInt(token.replace('.', '')) * BigInt(n)).toString().padStart(scale + 1, '0');
  return scale ? `${s.slice(0, -scale)}.${s.slice(-scale)}` : s;
};
const barTokens = n => ({ volume: times(MINUTE.volume, n), quoteVolume: times(MINUTE.quoteVolume, n), count: times(MINUTE.count, n),
  takerBuyVolume: times(MINUTE.takerBuyVolume, n), takerBuyQuoteVolume: times(MINUTE.takerBuyQuoteVolume, n) });
// A reference CSV of complete bars of the interval at the open times; over[t] replaces tokens of one row.
function refCsv(interval, openTimes, over = {}) {
  const step = KLINE_INTERVALS[interval];
  return Buffer.from(KLINE_HEADER + '\n' + openTimes.map(t => klineRow(t, { closeTime: String(t + step - 1), ...barTokens(step / MIN), ...over[t] })).join('\n') + '\n');
}
const opens = (startIso, n, step) => Array.from({ length: n }, (_, i) => ms(startIso) + i * step);
// A reader with openResearch1m's contract: every minute of the request carries the fixture tokens, except skipped ones.
function reader(skip = () => false) {
  return {
    read(request) {
      const a = ms(request.dataStart), b = ms(request.dataEnd), t = [];
      for (let x = a; x < b; x += MIN) if (!skip(x)) t.push(x);
      const col = token => Float64Array.from(t, () => Number(token));
      return { instrument: request.instrument, columns: { open_time: Float64Array.from(t), open: col(MINUTE.open), high: col(MINUTE.high), low: col(MINUTE.low),
        close: col(MINUTE.close), volume: col(MINUTE.volume), quote_volume: col(MINUTE.quoteVolume), count: col(MINUTE.count), taker_buy_volume: col(MINUTE.takerBuyVolume),
        taker_buy_quote_volume: col(MINUTE.takerBuyQuoteVolume) }, units: [] };
    }
  };
}
const aggregate = (interval, dataStart, dataEnd, skip) => aggregateResearch({ reader: reader(skip), instrument: BTC, timeframes: [interval], dataStart, dataEnd }).timeframes[interval];
const source = (interval, kind, startIso) => ({ ...visionSource(BTC, kind, ms(startIso), interval), interval, role: 'deciding' });
const compare1h = (csv, extra = {}) => compareInterval({ instrument: BTC, interval: '1h', timeframe: aggregate('1h', '2024-01-01T00:00:00.000Z', '2024-01-03T00:00:00.000Z'),
  sources: [source('1h', 'monthly', '2024-01-01T00:00:00.000Z')], load: () => ({ status: 'verified', csv }), windowStartMs: ms('2021-10-18T00:00:00.000Z'), ...extra });
const DISPOSITIONS = ['equal', 'mismatched', 'reference_quarantined', 'absent_row', 'absent_file'];
const reconciles = r => assert.equal(DISPOSITIONS.reduce((n, d) => n + r.dispositions[d], 0), r.completeBars);

test('compare V1/V4: every complete bar equal in all nine columns as exact decimals; counts reconcile', () => {
  const r = compare1h(refCsv('1h', opens('2024-01-01T00:00:00.000Z', 48, H)));
  assert.equal(r.completeBars, 48);
  assert.deepEqual(r.dispositions, { equal: 48, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
  assert.deepEqual([r.compared, r.numberEqual, r.referenceRows, r.quarantinedRows], [48, 48, 48, 0]);
  assert.deepEqual(r.files, { planned: 1, verified: 1, not_published: 0, not_downloaded: 0, failed: 0 });
  reconciles(r);
});

test('compare V1: a decimal difference is a mismatch even where the Numbers are equal; lists name open time and column, never values', () => {
  const t5 = ms('2024-01-01T05:00:00.000Z'), t7 = ms('2024-01-01T07:00:00.000Z');
  // 735369315.37500001 and 735369315.375 are one double; as decimals they differ.
  const r = compare1h(refCsv('1h', opens('2024-01-01T00:00:00.000Z', 48, H), { [t5]: { quoteVolume: '735369315.37500001' }, [t7]: { high: '42335.81', count: '198601' } }));
  assert.equal(Number('735369315.37500001'), Number(barTokens(60).quoteVolume));
  assert.deepEqual(r.dispositions, { equal: 46, mismatched: 2, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
  assert.deepEqual(r.lists.mismatched, [{ openTime: '2024-01-01T05:00:00.000Z', columns: ['quote_volume'] }, { openTime: '2024-01-01T07:00:00.000Z', columns: ['high', 'count'] }]);
  assert.equal(r.numberEqual, 47, 'Number equality is reported, not the proof');
  const text = JSON.stringify(r);
  for (const value of ['735369315', '42335.81', '198601', '42314']) assert.ok(!text.includes(value), value);
});

test('compare V4: absent_row, reference_quarantined and absent_file (not_published, not_downloaded, failed, not_planned) are listed and reconcile', () => {
  const all = opens('2024-01-01T00:00:00.000Z', 48, H), t10 = ms('2024-01-01T10:00:00.000Z'), t11 = ms('2024-01-01T11:00:00.000Z');
  const r = compare1h(refCsv('1h', all.filter(t => t !== t10), { [t11]: { volume: '-1' } }));
  assert.deepEqual(r.dispositions, { equal: 46, mismatched: 0, reference_quarantined: 1, absent_row: 1, absent_file: 0 });
  assert.deepEqual(r.lists.absent_row, ['2024-01-01T10:00:00.000Z']);
  assert.deepEqual(r.lists.reference_quarantined, [{ openTime: '2024-01-01T11:00:00.000Z', rule: 'volume must be >= 0' }]);
  assert.equal(r.quarantinedRows, 1);
  reconciles(r);
  for (const status of ['not_published', 'not_downloaded']) {
    const absent = compare1h(null, { load: () => ({ status }) });
    assert.deepEqual(absent.dispositions, { equal: 0, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 48 });
    assert.deepEqual(absent.lists.absent_file, [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-01.zip', reason: status, bars: 48 }]);
    assert.equal(absent.files[status], 1);
  }
  const failed = compare1h(Buffer.from(KLINE_HEADER + '\n' + klineRow(ms('2024-01-01T00:30:00.000Z'), { closeTime: String(ms('2024-01-01T00:30:00.000Z') + H - 1) }) + '\n'));
  assert.deepEqual(failed.lists.absent_file, [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-01.zip', reason: 'failed', bars: 48 }]);
  assert.match(failed.failures[0], /BTCUSDT-1h-2024-01\.zip: Vision klines: row 1 \(2024-01-01T00:30:00.000Z\): open_time not aligned to the 1h grid/);
  const twoVersions = compare1h(null, { load: s => ({ status: 'failed', error: `${s.file}: 2 local versions` }) });
  assert.deepEqual([twoVersions.files.failed, twoVersions.failures], [1, ['data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-01.zip: 2 local versions']]);
  // A bar whose month has no planned file: absent_file, reason not_planned (the 1w tail after 2024-01).
  const beyond = compareInterval({ instrument: BTC, interval: '1h', timeframe: aggregate('1h', '2024-01-31T22:00:00.000Z', '2024-02-01T02:00:00.000Z'),
    sources: [source('1h', 'monthly', '2024-01-01T00:00:00.000Z')], load: () => ({ status: 'verified', csv: refCsv('1h', opens('2024-01-31T22:00:00.000Z', 2, H)) }), windowStartMs: 0 });
  assert.deepEqual(beyond.dispositions, { equal: 2, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 2 });
  assert.deepEqual(beyond.lists.absent_file, [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-02.zip', reason: 'not_planned', bars: 2 }]);
});

test('compare: reference rows outside the window, at incomplete bars and at empty slots are counted, never compared', () => {
  const hole = ms('2024-01-01T03:30:00.000Z'), empty = t => t === hole || (t >= ms('2024-01-02T00:00:00.000Z') && t < ms('2024-01-02T02:00:00.000Z'));
  const timeframe = aggregate('1h', '2024-01-01T01:00:00.000Z', '2024-01-03T00:00:00.000Z', empty);
  const r = compareInterval({ instrument: BTC, interval: '1h', timeframe, sources: [source('1h', 'monthly', '2024-01-01T00:00:00.000Z')],
    load: () => ({ status: 'verified', csv: refCsv('1h', opens('2024-01-01T00:00:00.000Z', 48, H)) }), windowStartMs: ms('2024-01-01T01:00:00.000Z') });
  assert.equal(r.completeBars, 44);
  assert.deepEqual(r.notAdmitted, { beforeWindow: 1, afterResearch: 0 });
  assert.deepEqual([r.atIncompleteBar, r.atEmptySlot], [1, 2]);
  assert.deepEqual(r.lists.atEmptySlot, ['2024-01-02T00:00:00.000Z', '2024-01-02T01:00:00.000Z']);
  assert.deepEqual(r.dispositions, { equal: 44, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
});

test('compare V3: a poisoned boundary-week reference row (2025-10-13, closes after 2025-10-17) is not admitted and never read for values', () => {
  const weeks = aggregate('1w', '2025-09-29T00:00:00.000Z', '2025-10-17T00:00:00.000Z');
  assert.deepEqual(Array.from(weeks.columns.open_time, iso), ['2025-09-29T00:00:00.000Z', '2025-10-06T00:00:00.000Z']);
  const poison = { open: '666666.66', high: '666666.66', low: '666666.66', close: '666666.66', volume: '666666.666', quoteVolume: '666666.666', count: '666666',
    takerBuyVolume: '666666.666', takerBuyQuoteVolume: '666666.666' };
  const csv = refCsv('1w', [ms('2025-10-06T00:00:00.000Z'), ms('2025-10-13T00:00:00.000Z')], { [ms('2025-10-13T00:00:00.000Z')]: poison });
  const r = compareInterval({ instrument: BTC, interval: '1w', timeframe: weeks, sources: [{ ...source('1w', 'monthly', '2025-10-01T00:00:00.000Z'), role: 'reported' }],
    load: () => ({ status: 'verified', csv }), windowStartMs: ms('2021-10-18T00:00:00.000Z') });
  assert.deepEqual(r.notAdmitted, { beforeWindow: 0, afterResearch: 1 });
  assert.deepEqual(r.dispositions, { equal: 1, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 1 });
  assert.deepEqual(r.lists.absent_file, [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1w/BTCUSDT-1w-2025-09.zip', reason: 'not_planned', bars: 1 }]);
  assert.ok(!JSON.stringify(r).includes('666666'));
});

// CLI: a HYPE store built from 1m zips (two full days, 2025-06-30 and 2025-07-01, and sparse minutes elsewhere) and
// reference files stored locally as download would store them.
const FULL_DAYS = ['2025-06-30', '2025-07-01'];
let template;
function hypeStore() {
  if (template) return template;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-reference-compare-template-'));
  const s = { zipRoot: path.join(dir, 'data', 'vision'), cacheDir: path.join(dir, 'data', 'market-cache', 'f1-1m'), manifestPath: path.join(dir, 'results', 'manifest-f1-1m.json') };
  for (const month of ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10']) {
    const src = planUnits('HYPE', { from: month, to: month })[0].sources[0];
    const full = FULL_DAYS.find(day => day.startsWith(month));
    const rows = full ? minutes(`${full}T00:00:00.000Z`, 1440) : month === '2025-10' ? minutes('2025-10-16T23:58:00.000Z', 4) : minutes(`${month}-02T00:00:00.000Z`, 3);
    const zip = makeZip([{ name: src.csvName, data: klineCsv(rows) }]);
    storeSource(s.zipRoot, src, zip, checksumText(zip, src.zipName));
    for (let day = src.startMs; day < src.endMs; day += D) {
      if (FULL_DAYS.includes(iso(day).slice(0, 10))) continue;
      const daily = visionSource(HYPE, 'daily', day), marker = path.join(s.zipRoot, path.dirname(daily.file), '404', daily.zipName);
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, '404 on the zip and its CHECKSUM\n');
    }
    assert.notEqual(buildStore({ ...s, symbols: ['HYPE'], from: month, to: month }).status, 'failed');
  }
  template = dir;
  return dir;
}
// A fresh copy of the store with the reference files of the full days: 1h, 4h and 1d monthly 2025-06 and 2025-07 with
// the rows of those days. over[interval][t] changes tokens, drop[interval] removes rows, skip leaves files out
// ('4h' both months, '4h:2025-07' one), extra(zipRoot, plan) adds anything else.
function workspace({ over = {}, drop = {}, skip = [], extra = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-reference-compare-'));
  fs.cpSync(hypeStore(), dir, { recursive: true });
  const zipRoot = path.join(dir, 'data', 'vision');
  const plan = planReferences('HYPE');
  for (const interval of ['1h', '4h', '1d']) for (const day of FULL_DAYS) {
    const month = day.slice(0, 7);
    if (skip.includes(interval) || skip.includes(`${interval}:${month}`)) continue;
    const src = plan.find(s => s.interval === interval && s.kind === 'monthly' && s.zipName.endsWith(`${month}.zip`));
    const step = KLINE_INTERVALS[interval], rows = opens(`${day}T00:00:00.000Z`, D / step, step).filter(t => !(drop[interval] ?? []).includes(t));
    const zip = makeZip([{ name: src.csvName, data: refCsv(interval, rows, over[interval]) }]);
    storeSource(zipRoot, src, zip, checksumText(zip, src.zipName));
  }
  for (const f of extra) f(zipRoot, plan);
  return { dir, args: ['--symbols', 'HYPE', '--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'results', 'manifest-f1-1m.json')] };
}
async function run(argv, check) {
  let out = '';
  const code = await main(argv, { stdout: { write: s => { out += s; } }, check });
  return { code, summary: out ? JSON.parse(out) : null, out };
}

test('compare cli: equal 1h, 4h and 1d bars exit 0 with counts, digests, the git revision and no private paths', async () => {
  const w = workspace();
  const { code, summary, out } = await run(['compare', ...w.args]);
  assert.equal(code, 0, out);
  assert.equal(summary.status, 'ok');
  const hype = summary.symbols[0];
  assert.deepEqual(hype.window, { dataStart: '2025-05-01T00:00:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' });
  assert.deepEqual(hype.intervals['1h'].dispositions, { equal: 48, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
  assert.deepEqual(hype.intervals['4h'].dispositions, { equal: 12, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
  assert.deepEqual(hype.intervals['1d'].dispositions, { equal: 2, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 0 });
  assert.deepEqual([hype.intervals['1h'].compared, hype.intervals['1h'].numberEqual], [48, 48]);
  assert.equal(hype.intervals['1h'].files.planned, 21);
  assert.equal(hype.intervals['1h'].files.not_downloaded, 19);
  assert.equal(hype.intervals['1w'].completeBars, 0);
  assert.deepEqual(hype.weekly, { lastComparedWeek: null, unverifiedWeeks: { count: 0, first: null, last: null } });
  assert.deepEqual(Object.keys(hype.digests), ['1h', '4h', '1d', '1w', '5m', '15m']);
  assert.ok(Object.values(hype.digests).every(d => /^[0-9a-f]{64}$/.test(d)));
  assert.deepEqual(hype.c3Window, { dataStart: '2025-08-01T00:00:00.000Z', dataEnd: '2025-09-01T00:00:00.000Z' });
  assert.match(summary.code.gitRevision ?? '', /^[0-9a-f]{40}$/);
  assert.match(summary.code.aggregateSha256, /^[0-9a-f]{64}$/);
  assert.ok(!out.includes(w.dir) && !out.includes(os.homedir()));
  assert.ok(summary.memory.maxRssMiB > 0);
});

test('compare cli exit codes: mismatch or absent_row exit 1, quarantined or absent 1h/4h file exit 3, exit 1 wins, zero compared fails', async () => {
  const t3 = ms(`${FULL_DAYS[0]}T03:00:00.000Z`), t4 = ms(`${FULL_DAYS[0]}T04:00:00.000Z`);
  const mismatch = await run(['compare', ...workspace({ over: { '1h': { [t3]: { volume: '17378.461' } } } }).args]);
  assert.equal(mismatch.code, 1);
  assert.deepEqual(mismatch.summary.symbols[0].intervals['1h'].lists.mismatched, [{ openTime: `${FULL_DAYS[0]}T03:00:00.000Z`, columns: ['volume'] }]);
  assert.equal((await run(['compare', ...workspace({ drop: { '4h': [t4] } }).args])).code, 1);
  const quarantined = await run(['compare', ...workspace({ over: { '1h': { [t3]: { low: '0' } } } }).args]);
  assert.equal(quarantined.code, 3);
  assert.equal(quarantined.summary.status, 'incomplete');
  const marker = (interval, month) => (zipRoot, plan) => {
    const src = plan.find(s => s.interval === interval && s.kind === 'monthly' && s.zipName.endsWith(`${month}.zip`));
    const file = path.join(zipRoot, path.dirname(src.file), '404', src.zipName);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '404 on the zip and its CHECKSUM\n');
  };
  // The July 4h file not published: its six bars are absent_file (exit 3); the June bars are compared.
  const absent = await run(['compare', ...workspace({ skip: ['4h:2025-07'], extra: [marker('4h', '2025-07')] }).args]);
  assert.equal(absent.code, 3);
  assert.deepEqual(absent.summary.symbols[0].intervals['4h'].lists.absent_file, [{ file: 'data/futures/um/monthly/klines/HYPEUSDT/4h/HYPEUSDT-4h-2025-07.zip', reason: 'not_published', bars: 6 }]);
  assert.deepEqual(absent.summary.symbols[0].intervals['4h'].dispositions, { equal: 6, mismatched: 0, reference_quarantined: 0, absent_row: 0, absent_file: 6 });
  // Exit 1 wins over exit 3; and a deciding interval with zero compared bars fails.
  assert.equal((await run(['compare', ...workspace({ skip: ['4h:2025-07'], over: { '1h': { [t3]: { volume: '17378.462' } } } }).args])).code, 1);
  const none = await run(['compare', ...workspace({ skip: ['1h'] }).args]);
  assert.equal(none.code, 1);
  assert.match(none.summary.symbols[0].failures.join('\n'), /1h: zero compared bars/);
  // A missing 1d file is reported only.
  assert.equal((await run(['compare', ...workspace({ skip: ['1d'] }).args])).code, 0);
});

test('compare cli: two local versions of a reference file fail; unplanned files (a holdout month) are never read', async () => {
  const second = (zipRoot, plan) => {
    const src = plan.find(s => s.interval === '1h' && s.kind === 'monthly' && s.zipName.endsWith('2025-06.zip'));
    const zip = makeZip([{ name: src.csvName, data: refCsv('1h', opens(`${FULL_DAYS[0]}T00:00:00.000Z`, 23, H)) }]);
    storeSource(zipRoot, src, zip, checksumText(zip, src.zipName));
  };
  const two = await run(['compare', ...workspace({ extra: [second] }).args]);
  assert.equal(two.code, 1);
  assert.match(two.summary.symbols[0].failures.join('\n'), /HYPEUSDT-1h-2025-06\.zip: 2 local versions/);
  const poison = zipRoot => {
    const src = { ...visionSource(HYPE, 'monthly', ms('2025-10-01T00:00:00.000Z'), '1h') };
    const dir = path.join(zipRoot, path.dirname(src.file), 'f'.repeat(64));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, src.zipName), 'poison: not a zip');
    fs.writeFileSync(path.join(dir, `${src.zipName}.CHECKSUM`), 'poison\n');
  };
  const clean = await run(['compare', ...workspace({ extra: [poison] }).args]);
  assert.equal(clean.code, 0, clean.out);
  assert.ok(!clean.out.includes('2025-10.zip'));
});

test('compare cli: the memory guard aborts through the check seam; usage errors exit 2', async () => {
  const w = workspace();
  const aborted = await run(['compare', ...w.args], label => { if (label.startsWith('aggregate HYPEUSDT 2025-07')) throw new Error(`memory ceiling exceeded: 600 MiB > 512 MiB at ${label}`); });
  assert.equal(aborted.code, 1);
  assert.equal(aborted.summary.status, 'failed');
  assert.match(aborted.summary.error, /^memory ceiling exceeded: 600 MiB > 512 MiB at aggregate HYPEUSDT 2025-07/);
  assert.equal(aborted.summary.symbols, undefined, 'a trip aborts the whole run');
  assert.equal((await run(['compare', '--symbols', 'HYPE,HYPE'])).code, 2);
  assert.equal((await run(['compare', '--from', '2025-05'])).code, 2);
});
