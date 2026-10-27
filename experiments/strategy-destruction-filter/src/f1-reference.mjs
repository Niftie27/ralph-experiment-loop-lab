#!/usr/bin/env node
// F1a-3 reference klines (docs/f1/f1a-3-contract.md; plan docs/f1/f1a-3-plan.md sections d, h, i): Binance Vision USD-M
// kline files of higher intervals that the aggregates are checked against. Unattended, no TTY, Node built-ins only.
//   node src/f1-reference.mjs download|compare [--symbols BTC,ETH,SOL,XRP,DOGE,HYPE] [--data-dir DIR] [--manifest FILE] [--max-rss-mib N (1..512)]
// download is the only network step: the verified transport of the 1m files (src/vision-transport.mjs: HTTPS to
// data.binance.vision only, CHECKSUM first, version directories under <data-dir>/vision, 404 markers, finite retries).
// compare is offline: per symbol it aggregates the research 1m candles (src/f1-aggregate.mjs) to 1h, 4h, 1d and 1w over
// the research window and to 5m and 15m over the C3 month, and checks every complete bar against the reference files.
// Research files only (V3, approval 7(a)): no monthly file of 2025-10 or later, no daily file from 2025-10-17, and no
// planned file can hold a row that closes after 2025-10-17T00:00Z. JSON summary on stdout (counts, times, hashes and
// relative Vision paths only, never values). Exit: 0 ok; 1 any failure, a 1h or 4h mismatch or absent row, or a 1h or
// 4h interval without a compared bar; 2 usage error; 3 finished but a 1h or 4h bar has a quarantined reference row or
// no reference file (download: a 1h or 4h file is not published). 1 wins over 3.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PERIODS } from './h2-contract.mjs';
import { visionInstrument, visionSource, gridOpen, readZipMember, parseKlines, KLINE_INTERVALS, KLINE_HEADER, VISION_SYMBOLS } from './vision-source.mjs';
import { fetchSource } from './vision-transport.mjs';
import { localVersions, readVerifiedSource, recordedMissing } from './f1-1m-store.mjs';
import { openResearch1m } from './f1-1m-reader.mjs';
import { aggregateResearch, parseDecimal, decimalEquals, VALUE_COLUMNS, MODULE_SHA256 } from './f1-aggregate.mjs';
import { CEILING_MIB, memoryGuard } from './vision-1m.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const [RESEARCH_START, RESEARCH_END] = PERIODS.research.map(Date.parse);
// Roles: 1h and 4h decide acceptance, 1d and 1w are reported (approval 4(a)); 5m and 15m are the C3 sample.
export const ROLES = Object.freeze({ '1h': 'deciding', '4h': 'deciding', '1d': 'reported', '1w': 'reported', '5m': 'c3', '15m': 'c3' });
const INTERVALS = Object.keys(ROLES);
// The C3 months, recorded in the contract before any 5m or 15m result was seen.
export const C3_MONTHS = Object.freeze({ BTC: '2022-06', ETH: '2023-03', SOL: '2022-02', XRP: '2023-11', DOGE: '2024-05', HYPE: '2025-08' });
// First month with Vision files (plan section h listing; the 1m months before it are not_listed in F1a-2).
const LISTED_FROM = Object.freeze({ HYPE: '2025-05' });
const FIRST_MONTH = '2021-10', LAST_MONTH = '2025-09', LAST_WEEKLY_MONTH = '2024-01', DAILY_FROM = '2025-10-01', DAILY_TO = '2025-10-16';
const usage = message => Object.assign(new Error(message), { usage: true });
const iso = t => new Date(t).toISOString();
const monthMs = month => Date.parse(`${month}-01T00:00:00.000Z`);
const nextMonth = t => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); };

// Fails unless every row the source can hold closes at or before the end of the research window: the last grid open
// inside the file plus one interval (a weekly row may close after its file ends).
export function assertResearchSource(source) {
  const lastClose = gridOpen(source.interval, source.endMs - 1) + KLINE_INTERVALS[source.interval];
  if (!(lastClose <= RESEARCH_END)) throw new Error(`reference plan: ${source.file} can hold rows after ${PERIODS.research[1]} (holdout sealed)`);
  return source;
}
// The reference files of a symbol, in interval order (1h, 4h, 1d, 1w, 5m, 15m), then time order.
export function planReferences(symbol) {
  const instrument = visionInstrument(symbol);
  const first = monthMs(LISTED_FROM[symbol] ?? FIRST_MONTH);
  const plan = (interval, kind, startMs) => assertResearchSource({ ...visionSource(instrument, kind, startMs, interval), symbol, interval, role: ROLES[interval] });
  const months = (interval, last) => { const out = []; for (let t = first; t <= monthMs(last); t = nextMonth(t)) out.push(plan(interval, 'monthly', t)); return out; };
  const days = interval => { const out = []; for (let t = Date.parse(`${DAILY_FROM}T00:00:00.000Z`); t <= Date.parse(`${DAILY_TO}T00:00:00.000Z`); t += 86400000) out.push(plan(interval, 'daily', t)); return out; };
  return [...['1h', '4h', '1d'].flatMap(interval => [...months(interval, LAST_MONTH), ...days(interval)]), ...months('1w', LAST_WEEKLY_MONTH),
    ...['5m', '15m'].map(interval => plan(interval, 'monthly', monthMs(C3_MONTHS[symbol])))];
}

// The file that holds the row of a bar: the monthly file of its month before 2025-10-01, else the daily file of its day
// (the plan's split). Whether it is planned is the caller's question.
const DAILY_FROM_MS = Date.parse(`${DAILY_FROM}T00:00:00.000Z`);
function holdingFile(instrument, interval, t) {
  const d = new Date(t);
  return t < DAILY_FROM_MS ? visionSource(instrument, 'monthly', Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), interval).file
    : visionSource(instrument, 'daily', Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), interval).file;
}
// The raw value tokens of every row of a CSV that parseKlines has accepted as a file (so every row has 12 fields and a
// 13-digit open time), in VALUE_COLUMNS order. V1 compares these tokens, not their Numbers.
const VALUE_FIELDS = [1, 2, 3, 4, 5, 7, 8, 9, 10];
function* csvRows(csv) {
  const text = csv.toString('latin1');
  let pos = text.startsWith(`${KLINE_HEADER}\n`) ? KLINE_HEADER.length + 1 : 0;
  while (pos < text.length) {
    const end = text.indexOf('\n', pos), fields = text.slice(pos, end).split(',');
    yield { openTime: Number(fields[0]), tokens: VALUE_FIELDS.map(k => fields[k]) };
    pos = end + 1;
  }
}
const indexOf = (sorted, t) => { let a = 0, b = sorted.length; while (a < b) { const m = (a + b) >>> 1; if (sorted[m] < t) a = m + 1; else b = m; } return a < sorted.length && sorted[a] === t ? a : -1; };
export const DISPOSITIONS = Object.freeze(['equal', 'mismatched', 'reference_quarantined', 'absent_row', 'absent_file']);
const LIST_LIMIT = 10;

// Compares the complete bars of one aggregate timeframe with its planned reference files (V1, V3, V4). load(source)
// returns {status: 'verified', csv} or {status: 'not_published' | 'not_downloaded'} or {status: 'failed', error}.
// A reference row counts only when windowStartMs <= open_time and open_time + interval <= 2025-10-17T00:00Z (V3);
// rows at incomplete bars or empty slots are counted, never compared. Every complete bar gets exactly one disposition:
// equal or mismatched (every value column, the reference token as a scaled integer against the exact aggregate
// decimal), reference_quarantined, absent_row (its file is verified but has no row) or absent_file (its file is not
// published, not downloaded, failed or not planned). Lists hold open times, column names, rules and files, never values.
export function compareInterval({ instrument, interval, timeframe, sources, load, windowStartMs, check = () => {} }) {
  const step = KLINE_INTERVALS[interval], bars = timeframe.bars, open = timeframe.columns.open_time;
  const state = new Uint8Array(bars); // 0 not seen, 1 equal, 2 mismatched, 3 reference_quarantined
  const incompleteAt = new Set(timeframe.incomplete.map(b => Date.parse(b.openTime)));
  const fileState = new Map(), failures = [];
  const files = { planned: sources.length, verified: 0, not_published: 0, not_downloaded: 0, failed: 0 };
  const notAdmitted = { beforeWindow: 0, afterResearch: 0 };
  const lists = { mismatched: [], absent_row: [], reference_quarantined: [], absent_file: [], atEmptySlot: [] };
  let referenceRows = 0, quarantinedRows = 0, atIncompleteBar = 0, atEmptySlot = 0, numberEqual = 0;
  for (const source of sources) {
    let got = load(source), parsed = null;
    if (got.status === 'verified') {
      try { parsed = parseKlines(got.csv, { startMs: source.startMs, endMs: source.endMs, interval }); }
      catch (error) { got = { status: 'failed', error: `${source.file}: ${error.message}` }; }
    }
    fileState.set(source.file, got.status);
    files[got.status]++;
    if (got.status === 'failed') failures.push(got.error);
    if (parsed) {
      const quarantined = new Map(parsed.quarantined.map(q => [q.openTime, q.rule]));
      referenceRows += parsed.rowCount;
      quarantinedRows += parsed.quarantined.length;
      let accepted = 0;
      for (const row of csvRows(got.csv)) {
        const t = row.openTime, rule = quarantined.get(t), r = rule === undefined ? accepted++ : -1;
        if (t < windowStartMs) { notAdmitted.beforeWindow++; continue; }
        if (t + step > RESEARCH_END) { notAdmitted.afterResearch++; continue; }
        const i = indexOf(open, t);
        if (i < 0) {
          if (incompleteAt.has(t)) atIncompleteBar++;
          else { atEmptySlot++; if (lists.atEmptySlot.length < LIST_LIMIT) lists.atEmptySlot.push(iso(t)); }
          continue;
        }
        if (state[i]) throw new Error(`reference compare: the ${interval} bar ${iso(t)} has rows in two files`);
        if (rule !== undefined) { state[i] = 3; lists.reference_quarantined.push({ openTime: iso(t), rule }); continue; }
        const differ = VALUE_COLUMNS.filter((name, c) => { const ref = parseDecimal(row.tokens[c]); return !ref || !decimalEquals(ref, timeframe.exact(name, i)); });
        state[i] = differ.length ? 2 : 1;
        if (differ.length && lists.mismatched.length < LIST_LIMIT) lists.mismatched.push({ openTime: iso(t), columns: differ });
        if (VALUE_COLUMNS.every(name => parsed.columns[name][r] === timeframe.columns[name][i])) numberEqual++;
      }
    }
    check(`compare ${source.file}`);
  }
  const planned = new Set(sources.map(s => s.file)), absentFiles = new Map();
  const dispositions = Object.fromEntries(DISPOSITIONS.map(d => [d, 0]));
  let lastCompared = -1;
  for (let i = 0; i < bars; i++) {
    if (state[i]) { dispositions[DISPOSITIONS[state[i] - 1]]++; if (state[i] < 3) lastCompared = i; continue; }
    const file = holdingFile(instrument, interval, open[i]), status = planned.has(file) ? fileState.get(file) : 'not_planned';
    if (status === 'verified') { dispositions.absent_row++; if (lists.absent_row.length < LIST_LIMIT) lists.absent_row.push(iso(open[i])); continue; }
    dispositions.absent_file++;
    if (!absentFiles.has(file)) absentFiles.set(file, { file, reason: status, bars: 0 });
    absentFiles.get(file).bars++;
  }
  lists.absent_file = [...absentFiles.values()];
  if (DISPOSITIONS.reduce((n, d) => n + dispositions[d], 0) !== bars) throw new Error(`reference compare: ${interval} dispositions do not reconcile`);
  const after = bars - lastCompared - 1;
  return { interval, role: ROLES[interval], completeBars: bars, dispositions, compared: dispositions.equal + dispositions.mismatched, numberEqual, files,
    referenceRows, quarantinedRows, notAdmitted, atIncompleteBar, atEmptySlot,
    lastCompared: lastCompared < 0 ? null : iso(open[lastCompared]),
    afterLastCompared: { count: after, first: after ? iso(open[lastCompared + 1]) : null, last: after ? iso(open[bars - 1]) : null }, lists, failures };
}

// One reference file from the local store: exactly one verified version, else not_published (404 marker),
// not_downloaded, or failed (more than one version: no version-selection rule, ledger I77 (1); a bad stored copy).
function loadReference(zipRoot, source) {
  const versions = localVersions(zipRoot, source);
  if (versions.length > 1) return { status: 'failed', error: `${source.file}: ${versions.length} local versions (no version-selection rule)` };
  if (!versions.length) return { status: recordedMissing(zipRoot, source) ? 'not_published' : 'not_downloaded' };
  try { return { status: 'verified', csv: readZipMember(readVerifiedSource(zipRoot, source, versions[0]), source.csvName) }; }
  catch (error) { return { status: 'failed', error: `${source.file}: ${error.message}` }; }
}
// A memory-guard trip aborts the whole run, never only one symbol.
const memoryCheck = guard => label => { try { guard.check(label); } catch (error) { throw Object.assign(error, { memory: true }); } };

function compareSymbol(symbol, { zipRoot }, reader, check) {
  const instrument = visionInstrument(symbol), plan = planReferences(symbol);
  const windowStart = Math.max(RESEARCH_START, monthMs(LISTED_FROM[symbol] ?? FIRST_MONTH)), c3Start = monthMs(C3_MONTHS[symbol]);
  const out = { symbol, contract: instrument.contract, status: 'failed', window: { dataStart: iso(windowStart), dataEnd: iso(RESEARCH_END) },
    c3Window: { dataStart: iso(c3Start), dataEnd: iso(nextMonth(c3Start)) }, units: 0, digests: {}, intervals: {}, weekly: null, failures: [], reportedFailures: [] };
  try {
    const full = aggregateResearch({ reader, instrument, timeframes: ['1h', '4h', '1d', '1w'], ...out.window, check });
    const c3 = aggregateResearch({ reader, instrument, timeframes: ['5m', '15m'], ...out.c3Window, check });
    out.units = full.units.length;
    for (const interval of INTERVALS) {
      const timeframe = full.timeframes[interval] ?? c3.timeframes[interval];
      out.digests[interval] = timeframe.digest;
      out.intervals[interval] = compareInterval({ instrument, interval, timeframe, sources: plan.filter(s => s.interval === interval),
        load: s => loadReference(zipRoot, s), windowStartMs: ROLES[interval] === 'c3' ? c3Start : windowStart, check });
    }
  } catch (error) {
    if (error.memory) throw error;
    out.failures.push(error.message);
    return out;
  }
  const weekly = out.intervals['1w'];
  out.weekly = { lastComparedWeek: weekly.lastCompared, unverifiedWeeks: weekly.afterLastCompared };
  for (const r of Object.values(out.intervals)) {
    if (r.role !== 'deciding') { out.reportedFailures.push(...r.failures); continue; }
    out.failures.push(...r.failures);
    if (r.compared === 0) out.failures.push(`${r.interval}: zero compared bars`);
  }
  const deciding = ['1h', '4h'].map(i => out.intervals[i]);
  out.status = out.failures.length || deciding.some(r => r.dispositions.mismatched || r.dispositions.absent_row) ? 'failed'
    : deciding.some(r => r.dispositions.reference_quarantined || r.dispositions.absent_file) ? 'incomplete' : 'ok';
  return out;
}
function gitRevision() {
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try { return { gitRevision: git(['rev-parse', 'HEAD']), gitDirty: git(['status', '--porcelain', '--untracked-files=no']) !== '' }; }
  catch { return { gitRevision: null, gitDirty: null }; }
}
function compare(options, guard) {
  const reader = openResearch1m({ manifestPath: options.manifestPath, cacheDir: options.cacheDir });
  const check = memoryCheck(guard), symbols = [];
  for (const symbol of options.symbols) symbols.push(compareSymbol(symbol, options, reader, check));
  const status = symbols.some(s => s.status === 'failed') ? 'failed' : symbols.some(s => s.status === 'incomplete') ? 'incomplete' : 'ok';
  return { command: 'compare', status, code: { ...gitRevision(), aggregateModule: 'src/f1-aggregate.mjs', aggregateSha256: MODULE_SHA256 }, symbols };
}

const COMMANDS = ['download', 'compare'];
const FLAGS = ['--symbols', '--data-dir', '--manifest', '--max-rss-mib'];
function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command)) throw usage(`command must be one of ${COMMANDS.join('|')}`);
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!FLAGS.includes(rest[i])) throw usage(`unknown flag ${rest[i]}`);
    if (rest[i] in flags) throw usage(`duplicate flag ${rest[i]}`);
    if (i + 1 >= rest.length || rest[i + 1].startsWith('--')) throw usage(`flag ${rest[i]} needs a value`);
    flags[rest[i]] = rest[i + 1];
  }
  const symbols = (flags['--symbols'] ?? Object.keys(VISION_SYMBOLS).join(',')).split(',');
  if (new Set(symbols).size !== symbols.length) throw usage('duplicate symbol');
  for (const symbol of symbols) visionInstrument(symbol);
  const maxRssMiB = flags['--max-rss-mib'] === undefined ? CEILING_MIB : Number(flags['--max-rss-mib']);
  if (!Number.isSafeInteger(maxRssMiB) || maxRssMiB < 1 || maxRssMiB > CEILING_MIB) throw usage(`--max-rss-mib must be an integer 1..${CEILING_MIB} (the ceiling can only be lowered)`);
  const dataDir = path.resolve(flags['--data-dir'] ?? path.join(ROOT, 'data'));
  return { command, symbols, maxRssMiB, zipRoot: path.join(dataDir, 'vision'), cacheDir: path.join(dataDir, 'market-cache', 'f1-1m'),
    manifestPath: path.resolve(flags['--manifest'] ?? path.join(ROOT, 'results', 'manifest-f1-1m.json')) };
}

// Sequential, one source at a time. Counts per interval: verified = downloaded + skipped and verified + missing +
// failed = expected. missing: 404 on the zip and its CHECKSUM (marker written), listed with interval and role.
async function download({ symbols, zipRoot }, guard, deps) {
  const counts = Object.fromEntries(INTERVALS.map(i => [i, { expected: 0, downloaded: 0, skipped: 0, verified: 0, missing: 0, failed: 0 }]));
  const missing = [], repaired = [], failures = [];
  for (const symbol of symbols) for (const source of planReferences(symbol)) {
    const c = counts[source.interval];
    c.expected++;
    guard.check(source.file);
    try {
      const result = await fetchSource(source, zipRoot, deps, () => {});
      if (result.status === 'missing') { c.missing++; missing.push({ file: source.file, interval: source.interval, role: source.role }); continue; }
      if (result.repaired) repaired.push(source.checksumFile);
      c[result.status]++; c.verified++;
    } catch (error) {
      c.failed++;
      failures.push(error.message.startsWith(source.file) ? error.message : `${source.file}: ${error.message}`);
    }
  }
  const status = failures.length ? 'failed' : missing.some(m => m.role === 'deciding') ? 'incomplete' : 'ok';
  return { command: 'download', status, symbols, counts, missing, repaired, failures };
}

const EXIT = { ok: 0, failed: 1, usage: 2, incomplete: 3 };
export async function main(argv, deps = {}) {
  const io = { fetch: deps.fetch ?? globalThis.fetch, stdout: deps.stdout ?? process.stdout, sleep: deps.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))) };
  let summary, guard;
  try {
    const options = parseArgs(argv);
    guard = memoryGuard(options.maxRssMiB, deps.check);
    try { summary = options.command === 'download' ? await download(options, guard, io) : compare(options, guard); }
    catch (error) { summary = { command: options.command, status: 'failed', error: error.message }; }
    const memory = guard.report();
    if (memory.maxRssMiB > options.maxRssMiB) summary = { ...summary, status: 'failed', error: `memory ceiling exceeded: maxRSS ${memory.maxRssMiB} MiB > ${options.maxRssMiB} MiB` };
    summary = { ...summary, memory, runtime: { node: process.version, platform: process.platform } };
  } catch (error) {
    if (!error.usage) throw error;
    summary = { command: argv[0] ?? null, status: 'usage', error: error.message };
  } finally { guard?.stop(); }
  io.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  return EXIT[summary.status];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
