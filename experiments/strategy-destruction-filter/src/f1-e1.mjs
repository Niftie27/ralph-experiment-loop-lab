#!/usr/bin/env node
// F1a-3 amendment 1 D1 (docs/f1/f1a-3-contract.md): the exception class E1, the research hours of a symbol where Binance
// Vision's own 60 1m rows do not reproduce Vision's 1h row in at least one of the nine value columns (first open, max
// high, min low, last close; exact decimal sums of volume, quote_volume, count, taker_buy_volume, taker_buy_quote_volume).
// Independent of the aggregator: nothing from src/f1-aggregate.mjs or src/f1-reference.mjs is imported, and the CSV
// tokens are summed here as exact decimals (BigInt coefficient and scale). Offline, unattended, Node built-ins only.
// Amendment 2 D5: the same script computes the exception class E2, the research 4h and 1d bars where Vision's own 1h
// rows (all of them present) do not reproduce Vision's 4h or 1d row in at least one of the nine value columns.
//   node src/f1-e1.mjs [--symbols BTC,ETH,SOL,XRP,DOGE,HYPE] [--data-dir DIR] [--manifest FILE] [--out FILE] [--e2-out FILE] [--max-rss-mib N (1..512)]
// Inputs per research unit of the 1m manifest: its 1m sources at the versions the manifest records (a monthly row wins,
// a daily fill row counts only at a minute the monthly file lacks, as in the store), and the 1h, 4h and 1d reference
// files that hold its bars (referenceFiles), each with exactly one verified local version. Only rows inside the unit
// are read: a row outside it (the holdout minutes of the shared 2025-10 monthly 1m file) is skipped on its open time alone.
// Per hour: 60 minutes and a 1h row are checked (equal or E1); fewer minutes with a row are short, minutes without a
// row noReference, a row without minutes referenceOnly; only E1 hours are listed. Per 4h or 1d bar the same with its
// 1h rows (4 or 24) in place of the minutes; only E2 bars are listed.
// Output: the E1 list as CSV (default docs/f1/f1a-3-e1.csv): symbol, open_time, minutes, columns (the differing value
// columns, ';'-joined) and per sum column the relative difference (1m sum - 1h token) / 1h token where that sum differs,
// 4 significant digits. The E2 list (default docs/f1/f1a-3-e2.csv): symbol, interval, open_time, columns and the
// relative differences (1h sum - bar token) / bar token, by symbol, then 4h before 1d, then open time. JSON summary on
// stdout: counts, file names and hashes, never values. Exit: 0 ok; 1 any failure (no list written); 2 usage error; 3 a
// 1h, 4h or 1d file not published or not downloaded (lists written, its bars unchecked).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PERIODS } from './h2-contract.mjs';
import { visionInstrument, visionSource, readZipMember, KLINE_HEADER, VISION_SYMBOLS } from './vision-source.mjs';
import { localVersions, readVerifiedSource, recordedMissing, readManifest } from './f1-1m-store.mjs';
import { CEILING_MIB, memoryGuard } from './vision-1m.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MODULE_SHA256 = createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex');
const RESEARCH_END = Date.parse(PERIODS.research[1]);
const MIN = 60000, HOUR = 3600000, DAY = 86400000, DAILY_FROM = Date.parse('2025-10-01T00:00:00.000Z');
const COLUMNS = ['open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume'];
const SUMS = COLUMNS.slice(4), FIELDS = [1, 2, 3, 4, 5, 7, 8, 9, 10]; // CSV fields of COLUMNS
export const E1_HEADER = ['symbol', 'open_time', 'minutes', 'columns', ...SUMS.map(c => `rel_${c}`)].join(',');
export const E2_HEADER = ['symbol', 'interval', 'open_time', 'columns', ...SUMS.map(c => `rel_${c}`)].join(',');
const BARS = { '4h': 4 * HOUR, '1d': DAY };
const LIST_LIMIT = 10;
const iso = t => new Date(t).toISOString();
const usage = message => Object.assign(new Error(message), { usage: true });

// Exact decimals: a plain decimal token (optional minus, digits, optional fraction) as {coef: BigInt, scale}.
const PLAIN = /^-?\d+(\.\d+)?$/;
function decimal(token, column) {
  if (typeof token !== 'string' || !PLAIN.test(token)) throw new Error(`${column} is not a plain decimal`);
  const dot = token.indexOf('.');
  return dot < 0 ? { coef: BigInt(token), scale: 0 } : { coef: BigInt(token.slice(0, dot) + token.slice(dot + 1)), scale: token.length - dot - 1 };
}
const aligned = (a, b) => {
  if (a.scale === b.scale) return [a.coef, b.coef, a.scale];
  const s = Math.max(a.scale, b.scale);
  return [a.coef * 10n ** BigInt(s - a.scale), b.coef * 10n ** BigInt(s - b.scale), s];
};
const add = (a, b) => { const [x, y, scale] = aligned(a, b); return { coef: x + y, scale }; };
const cmp = (a, b) => { const [x, y] = aligned(a, b); return x < y ? -1 : x > y ? 1 : 0; };

// One hour: minuteTokens are the value tokens (COLUMNS order) of its 1m rows in time order, hourTokens those of its 1h
// row. Returns null when the minutes reproduce the row in all nine columns, else {columns, relative}: the differing
// columns and, for each differing sum, (sum - row) / row to 4 significant digits. Errors name the column, never a token.
export function e1Hour(minuteTokens, hourTokens) {
  const at = (row, c) => decimal(row[c], COLUMNS[c]);
  const reference = COLUMNS.map((name, c) => at(hourTokens, c));
  let high = at(minuteTokens[0], 1), low = at(minuteTokens[0], 2);
  const sums = SUMS.map((name, k) => at(minuteTokens[0], 4 + k));
  for (let i = 1; i < minuteTokens.length; i++) {
    const row = minuteTokens[i], h = at(row, 1), l = at(row, 2);
    if (cmp(h, high) > 0) high = h;
    if (cmp(l, low) < 0) low = l;
    for (let k = 0; k < SUMS.length; k++) sums[k] = add(sums[k], at(row, 4 + k));
  }
  const ours = [at(minuteTokens[0], 0), high, low, at(minuteTokens.at(-1), 3), ...sums];
  const columns = [], relative = {};
  for (let c = 0; c < COLUMNS.length; c++) {
    if (cmp(ours[c], reference[c]) === 0) continue;
    columns.push(COLUMNS[c]);
    if (c >= 4) { const [x, y] = aligned(ours[c], reference[c]); relative[COLUMNS[c]] = (Number(x - y) / Number(y)).toExponential(3); }
  }
  return columns.length ? { columns, relative } : null;
}

// The rows of a kline CSV whose open time lies in [startMs, endMs), as {openTime, tokens} (tokens in COLUMNS order).
// Every open time must be 13 digits and strictly increasing; a row outside the range is skipped on its open time alone,
// so no other field of it is read. A row inside must have 12 fields and lie on the step grid.
export function* csvRows(csv, { startMs, endMs, step, file }) {
  const text = csv.toString('latin1');
  let pos = text.startsWith(`${KLINE_HEADER}\n`) ? KLINE_HEADER.length + 1 : 0, row = 0, previous = -Infinity;
  while (pos < text.length) {
    const newline = text.indexOf('\n', pos), end = newline < 0 ? text.length : newline;
    const comma = text.indexOf(',', pos), head = text.slice(pos, comma < 0 || comma > end ? end : comma);
    row++;
    if (!/^\d{13}$/.test(head)) throw new Error(`${file}: row ${row}: open_time is not 13 digits`);
    const t = Number(head);
    if (t <= previous) throw new Error(`${file}: row ${row} (${iso(t)}): open_time not strictly increasing`);
    previous = t;
    if (t >= startMs && t < endMs) {
      const fields = text.slice(pos, end).split(',');
      if (fields.length !== 12) throw new Error(`${file}: row ${row} (${iso(t)}): expected 12 fields`);
      if (t % step !== 0) throw new Error(`${file}: row ${row} (${iso(t)}): open_time not aligned to ${step / MIN} minutes`);
      yield { openTime: t, tokens: FIELDS.map(k => fields[k]) };
    }
    pos = end + 1;
  }
}

// The 1h, 4h or 1d reference files that hold the bars of a research unit (plan split and amendment 1 D2): the monthly
// file of its month before 2025-10-01, the daily file of each day from 2025-10-01, and the daily file of each day the
// unit fills from daily 1m files (filledRanges).
export function referenceFiles(entry, interval) {
  const instrument = { exchange: entry.exchange, market: entry.market, contract: entry.contract };
  const a = Date.parse(entry.dataStart), b = Date.parse(entry.dataEnd), days = new Set(), out = [];
  if (a < DAILY_FROM) { const d = new Date(a); out.push(visionSource(instrument, 'monthly', Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), interval)); }
  else for (let t = a - a % DAY; t < b; t += DAY) days.add(t);
  for (const r of entry.filledRanges) { const s = Date.parse(r.start); for (let t = s - s % DAY; t < Date.parse(r.end); t += DAY) days.add(t); }
  return [...out, ...[...days].sort((x, y) => x - y).map(t => visionSource(instrument, 'daily', t, interval))];
}
export const hourFiles = entry => referenceFiles(entry, '1h');

// One reference file from the local store: exactly one verified version, else not_published (404 marker),
// not_downloaded, or failed (more than one version: no version-selection rule; a bad stored copy).
function loadReferenceFile(zipRoot, source) {
  const versions = localVersions(zipRoot, source);
  if (versions.length > 1) return { status: 'failed', error: `${source.file}: ${versions.length} local versions (no version-selection rule)` };
  if (!versions.length) return { status: recordedMissing(zipRoot, source) ? 'not_published' : 'not_downloaded' };
  try { return { status: 'verified', sha: versions[0], csv: readZipMember(readVerifiedSource(zipRoot, source, versions[0]), source.csvName) }; }
  catch (error) { return { status: 'failed', error: `${source.file}: ${error.message}` }; }
}
// A 1m source of a manifest entry ({file, sha256}) as a Vision source for the store readers.
function minuteSource(s) {
  const zipName = path.posix.basename(s.file);
  return { file: s.file, zipName, csvName: zipName.replace(/\.zip$/, '.csv'), kind: s.file.includes('/daily/') ? 'daily' : 'monthly' };
}

// One research unit: classifies its hours into out.hours and appends its E1 hours to list. Returns the unit's 1h rows.
function unitHours(symbol, entry, zipRoot, out, list, inputs) {
  const a = Date.parse(entry.dataStart), b = Date.parse(entry.dataEnd);
  const minutes = new Map(); // open time -> tokens; monthly sources first, a daily row only where no monthly row is
  const sources = entry.sources.map(s => ({ ...s, source: minuteSource(s) })).sort((x, y) => (x.source.kind === 'monthly' ? 0 : 1) - (y.source.kind === 'monthly' ? 0 : 1));
  for (const s of sources) {
    const csv = readZipMember(readVerifiedSource(zipRoot, s.source, s.sha256), s.source.csvName);
    inputs.push(`${s.file} ${s.sha256}`);
    out.minuteSources++;
    for (const row of csvRows(csv, { startMs: a, endMs: b, step: MIN, file: s.file })) if (!minutes.has(row.openTime)) minutes.set(row.openTime, row.tokens);
  }
  const reference = new Map();
  for (const source of hourFiles(entry)) {
    const got = loadReferenceFile(zipRoot, source);
    out.hourFiles.planned++;
    out.hourFiles[got.status]++;
    if (got.status === 'failed') throw new Error(got.error);
    if (got.status !== 'verified') { out.absentFiles.push({ file: source.file, reason: got.status }); continue; }
    inputs.push(`${source.file} ${got.sha}`);
    for (const row of csvRows(got.csv, { startMs: a, endMs: b, step: HOUR, file: source.file })) {
      if (reference.has(row.openTime)) throw new Error(`the 1h row ${iso(row.openTime)} is in two files`);
      reference.set(row.openTime, row.tokens);
    }
  }
  const byHour = new Map();
  for (const [t, tokens] of minutes) { const h = t - t % HOUR; (byHour.get(h) ?? byHour.set(h, []).get(h)).push([t, tokens]); }
  for (const h of [...new Set([...byHour.keys(), ...reference.keys()])].sort((x, y) => x - y)) {
    const rows = byHour.get(h) ?? [], row = reference.get(h);
    if (!row) { out.hours.noReference++; continue; }
    if (!rows.length) { out.hours.referenceOnly++; continue; }
    if (rows.length < 60) { out.hours.short++; if (out.shortHours.length < LIST_LIMIT) out.shortHours.push(iso(h)); continue; }
    out.hours.checked++;
    rows.sort((x, y) => x[0] - y[0]);
    let differ;
    try { differ = e1Hour(rows.map(r => r[1]), row); } catch (error) { throw new Error(`${entry.contract} hour ${iso(h)}: ${error.message}`); }
    if (!differ) { out.hours.equal++; continue; }
    out.hours.e1++;
    list.push([symbol, iso(h), rows.length, differ.columns.join(';'), ...SUMS.map(c => differ.relative[c] ?? '')].join(','));
  }
  return reference;
}

// The 4h or 1d bars of one research unit (amendment 2 D5): classifies them into out.bars[interval] against the unit's
// 1h rows and appends the E2 bars to list. A bar is checked only when its 1h rows are all present; e1Hour applies the
// D1 rules to any parts in time order.
function unitBars(symbol, entry, interval, hourRows, zipRoot, out, list, inputs) {
  const a = Date.parse(entry.dataStart), b = Date.parse(entry.dataEnd), step = BARS[interval];
  const files = out.barFiles[interval], counts = out.bars[interval], reference = new Map();
  for (const source of referenceFiles(entry, interval)) {
    const got = loadReferenceFile(zipRoot, source);
    files.planned++;
    files[got.status]++;
    if (got.status === 'failed') throw new Error(got.error);
    if (got.status !== 'verified') { out.absentFiles.push({ file: source.file, reason: got.status }); continue; }
    inputs.push(`${source.file} ${got.sha}`);
    for (const row of csvRows(got.csv, { startMs: a, endMs: b - step + 1, step, file: source.file })) {
      if (reference.has(row.openTime)) throw new Error(`the ${interval} row ${iso(row.openTime)} is in two files`);
      reference.set(row.openTime, row.tokens);
    }
  }
  const slots = new Set(reference.keys());
  for (const h of hourRows.keys()) { const t = h - h % step; if (t + step <= b) slots.add(t); }
  for (const t of [...slots].sort((x, y) => x - y)) {
    const row = reference.get(t), hours = [];
    for (let h = t; h < t + step; h += HOUR) if (hourRows.has(h)) hours.push(hourRows.get(h));
    if (!row) { counts.noReference++; continue; }
    if (!hours.length) { counts.referenceOnly++; continue; }
    if (hours.length < step / HOUR) { counts.short++; if (out.shortBars[interval].length < LIST_LIMIT) out.shortBars[interval].push(iso(t)); continue; }
    counts.checked++;
    let differ;
    try { differ = e1Hour(hours, row); } catch (error) { throw new Error(`${entry.contract} ${interval} bar ${iso(t)}: ${error.message}`); }
    if (!differ) { counts.equal++; continue; }
    counts.e2++;
    list.push([symbol, interval, iso(t), differ.columns.join(';'), ...SUMS.map(c => differ.relative[c] ?? '')].join(','));
  }
}

// A memory-guard trip aborts the whole run, never only one symbol.
const memoryCheck = guard => label => { try { guard.check(label); } catch (error) { throw Object.assign(error, { memory: true }); } };

function e1Symbol(symbol, entries, zipRoot, check, inputs) {
  const instrument = visionInstrument(symbol);
  const units = entries.filter(e => e.period === 'research' && e.exchange === instrument.exchange && e.market === instrument.market && e.contract === instrument.contract);
  const out = { symbol, contract: instrument.contract, status: 'failed', window: null, units: units.length, minuteSources: 0,
    hourFiles: { planned: 0, verified: 0, not_published: 0, not_downloaded: 0, failed: 0 }, absentFiles: [],
    hours: { checked: 0, equal: 0, e1: 0, short: 0, noReference: 0, referenceOnly: 0 }, shortHours: [],
    barFiles: {}, bars: {}, shortBars: {}, failures: [] };
  for (const interval of Object.keys(BARS)) {
    out.barFiles[interval] = { planned: 0, verified: 0, not_published: 0, not_downloaded: 0, failed: 0 };
    out.bars[interval] = { checked: 0, equal: 0, e2: 0, short: 0, noReference: 0, referenceOnly: 0 };
    out.shortBars[interval] = [];
  }
  const list = [], e2 = Object.fromEntries(Object.keys(BARS).map(interval => [interval, []]));
  try {
    if (!units.length) throw new Error(`${instrument.contract}: no research units in the 1m manifest`);
    for (let i = 1; i < units.length; i++) if (units[i].dataStart !== units[i - 1].dataEnd) throw new Error(`${instrument.contract}: research units not contiguous at ${units[i].dataStart}`);
    if (Date.parse(units.at(-1).dataEnd) !== RESEARCH_END) throw new Error(`${instrument.contract}: research units end at ${units.at(-1).dataEnd}, not ${PERIODS.research[1]}`);
    out.window = { dataStart: units[0].dataStart, dataEnd: units.at(-1).dataEnd };
    for (const entry of units) {
      const hourRows = unitHours(symbol, entry, zipRoot, out, list, inputs);
      for (const interval of Object.keys(BARS)) unitBars(symbol, entry, interval, hourRows, zipRoot, out, e2[interval], inputs);
      check(`e1 ${instrument.contract} ${entry.dataStart.slice(0, 7)}`);
    }
  } catch (error) {
    if (error.memory) throw error;
    out.failures.push(error.message);
    return { out, list: [], e2List: [] };
  }
  out.status = out.absentFiles.length ? 'incomplete' : 'ok';
  return { out, list, e2List: Object.values(e2).flat() };
}
function gitRevision() {
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try { return { gitRevision: git(['rev-parse', 'HEAD']), gitDirty: git(['status', '--porcelain', '--untracked-files=no']) !== '' }; }
  catch { return { gitRevision: null, gitDirty: null }; }
}
const sha256 = text => createHash('sha256').update(text).digest('hex');
function e1(options, guard) {
  const { entries } = readManifest(options.manifestPath);
  const check = memoryCheck(guard), symbols = [], rows = [], e2Rows = [], inputs = [];
  for (const symbol of options.symbols) {
    const { out, list, e2List } = e1Symbol(symbol, entries, options.zipRoot, check, inputs);
    symbols.push(out);
    rows.push(...list);
    e2Rows.push(...e2List);
  }
  const status = symbols.some(s => s.status === 'failed') ? 'failed' : symbols.some(s => s.status === 'incomplete') ? 'incomplete' : 'ok';
  const text = [E1_HEADER, ...rows, ''].join('\n'), e2Text = [E2_HEADER, ...e2Rows, ''].join('\n');
  const summary = { command: 'e1', status, csv: { file: path.basename(options.out), rows: rows.length, sha256: sha256(text) },
    e2Csv: { file: path.basename(options.e2Out), rows: e2Rows.length, sha256: sha256(e2Text) },
    inputs: { minuteSources: symbols.reduce((n, s) => n + s.minuteSources, 0), hourFiles: symbols.reduce((n, s) => n + s.hourFiles.verified, 0),
      barFiles: symbols.reduce((n, s) => n + Object.values(s.barFiles).reduce((k, f) => k + f.verified, 0), 0), sha256: sha256(inputs.join('\n') + '\n') },
    code: { ...gitRevision(), module: 'src/f1-e1.mjs', sha256: MODULE_SHA256 }, symbols };
  return { summary, text, e2Text };
}

const FLAGS = ['--symbols', '--data-dir', '--manifest', '--out', '--e2-out', '--max-rss-mib'];
function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!FLAGS.includes(argv[i])) throw usage(`unknown argument ${argv[i]}`);
    if (argv[i] in flags) throw usage(`duplicate flag ${argv[i]}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw usage(`flag ${argv[i]} needs a value`);
    flags[argv[i]] = argv[i + 1];
  }
  const symbols = (flags['--symbols'] ?? Object.keys(VISION_SYMBOLS).join(',')).split(',');
  if (new Set(symbols).size !== symbols.length) throw usage('duplicate symbol');
  for (const symbol of symbols) visionInstrument(symbol);
  const maxRssMiB = flags['--max-rss-mib'] === undefined ? CEILING_MIB : Number(flags['--max-rss-mib']);
  if (!Number.isSafeInteger(maxRssMiB) || maxRssMiB < 1 || maxRssMiB > CEILING_MIB) throw usage(`--max-rss-mib must be an integer 1..${CEILING_MIB} (the ceiling can only be lowered)`);
  const dataDir = path.resolve(flags['--data-dir'] ?? path.join(ROOT, 'data'));
  return { symbols, maxRssMiB, zipRoot: path.join(dataDir, 'vision'),
    manifestPath: path.resolve(flags['--manifest'] ?? path.join(ROOT, 'results', 'manifest-f1-1m.json')),
    out: path.resolve(flags['--out'] ?? path.join(ROOT, '..', '..', 'docs', 'f1', 'f1a-3-e1.csv')),
    e2Out: path.resolve(flags['--e2-out'] ?? path.join(ROOT, '..', '..', 'docs', 'f1', 'f1a-3-e2.csv')) };
}

const EXIT = { ok: 0, failed: 1, usage: 2, incomplete: 3 };
export async function main(argv, deps = {}) {
  const stdout = deps.stdout ?? process.stdout;
  let summary, guard;
  try {
    const options = parseArgs(argv);
    guard = memoryGuard(options.maxRssMiB, deps.check);
    let text = null, e2Text = null;
    try { ({ summary, text, e2Text } = e1(options, guard)); }
    catch (error) { summary = { command: 'e1', status: 'failed', error: error.message }; }
    const memory = guard.report();
    if (memory.maxRssMiB > options.maxRssMiB) summary = { ...summary, status: 'failed', error: `memory ceiling exceeded: maxRSS ${memory.maxRssMiB} MiB > ${options.maxRssMiB} MiB` };
    // The lists are written only by a run without failure, each atomically.
    if (summary.status === 'failed') { if (summary.csv) summary = { ...summary, csv: null, e2Csv: null }; }
    else for (const [file, content] of [[options.out, text], [options.e2Out, e2Text]]) {
      fs.writeFileSync(`${file}.tmp`, content);
      fs.renameSync(`${file}.tmp`, file);
    }
    summary = { ...summary, memory, runtime: { node: process.version, platform: process.platform } };
  } catch (error) {
    if (!error.usage) throw error;
    summary = { command: 'e1', status: 'usage', error: error.message };
  } finally { guard?.stop(); }
  stdout.write(JSON.stringify(summary, null, 2) + '\n');
  return EXIT[summary.status];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
