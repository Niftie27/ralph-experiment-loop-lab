// F1a-4 funding-rate history (docs/f1/f1a-4-contract.md with amendment 1): Binance Vision monthly fundingRate files,
// parsed on read (storage S1). Node built-ins only. Every check fails closed: a file that fails gives no rows at all.
// Seal (contract sections 1 to 3, amendment 1 A1): a research parse reads only calc_time of a row at or after
// 2025-10-17T00:00Z (routing and order) and never counts, returns or names such a row; its errors name only the file
// and "sealed part". The holdout integrity path parses every field with sealMs = Infinity and reports pass or fail only.
//   node src/f1-funding.mjs download|verify [--symbols BTC,ETH,SOL,XRP,DOGE,HYPE] [--data-dir DIR] [--manifest FILE] [--max-rss-mib N (1..512)]
// download is the only network step (src/vision-transport.mjs fetchSource, unchanged). JSON summary on stdout: counts,
// times and relative Vision paths only, never rates or sizes. Exit: 0 ok, 1 failure or stop, 2 usage, 3 a file missing.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERIODS } from './h2-contract.mjs';
import { verifyZip, readZipMember, planFundingUnits, visionInstrument, VISION_SYMBOLS } from './vision-source.mjs';
import { notListedSources, localVersions, readVerifiedSource, readManifest } from './f1-1m-store.mjs';
import { fetchSource } from './vision-transport.mjs';
import { memoryGuard, CEILING_MIB } from './vision-1m.mjs';

export const FUNDING_HEADER = 'calc_time,funding_interval_hours,last_funding_rate';
export const SEAL_MS = Date.parse(PERIODS.holdout[0]);
export const HOUR_MS = 3600000;
// Parser bounds (m7): a chosen validation policy, not an exchange guarantee; changing either needs a new decision.
export const MAX_OFFSET_MS = 15000;
export const INTERVALS = Object.freeze([1, 2, 4, 8]);
const INTERVAL_TOKENS = new Map(INTERVALS.map(h => [String(h), h]));
const MAX_PLACES = 8;
const fail = message => { throw new Error(`Vision funding: ${message}`); };

// The exact decimal of a rate token, plain or exponent form: { decimal, places } with decimal the canonical plain
// spelling (no exponent, no trailing zeros, no leading zeros, "0" for every zero, "-" only for a negative value) and
// places its exact decimal places. More than 8 exact places, a malformed token and a value that is no finite Number fail.
const RATE_TOKEN = /^(-?)(\d+)(?:\.(\d+))?(?:[Ee]([+-]?\d+))?$/;
export function canonicalRate(token) {
  const m = typeof token === 'string' ? RATE_TOKEN.exec(token) : null;
  if (!m) fail('malformed rate token');
  let digits = (m[2] + (m[3] ?? '')).replace(/^0+/, ''), scale = (m[3]?.length ?? 0) - Number(m[4] ?? 0);
  if (!digits) return { decimal: '0', places: 0 };
  const significant = digits.replace(/0+$/, '');
  scale -= digits.length - significant.length;
  digits = significant;
  if (scale > MAX_PLACES) fail('rate has more than 8 exact decimal places');
  if (digits.length - scale > 310) fail('rate is not a finite Number');
  const body = scale <= 0 ? digits + '0'.repeat(-scale)
    : digits.length > scale ? `${digits.slice(0, digits.length - scale)}.${digits.slice(digits.length - scale)}`
      : `0.${'0'.repeat(scale - digits.length)}${digits}`;
  const decimal = (m[1] ? '-' : '') + body;
  if (!Number.isFinite(Number(decimal))) fail('rate is not a finite Number');
  return { decimal, places: Math.max(0, scale) };
}

// Funding CSV rows of one source file. The first line is the exact header or a numeric first row; every line ends with
// a newline. Every row's calc_time (exactly 13 digits, inside the file's month) must be strictly after the previous
// row's in source order, checked before anything else. Rows with calc_time < sealMs are research rows: exactly 3
// fields, calc_time mod 1 h below 15,000 ms (settlement time = calc_time floored to the hour), no second row in one
// settlement hour, interval 1, 2, 4 or 8, and a canonical rate. Returns frozen columns in source order.
export function parseFunding(csv, source, { sealMs = SEAL_MS } = {}) {
  const buf = Buffer.from(csv.buffer, csv.byteOffset, csv.byteLength);
  const file = source.file, sealable = source.endMs > sealMs, wholly = source.startMs >= sealMs;
  if (!buf.length || buf[buf.length - 1] !== 0x0a) fail(`${file}: file does not end with a newline`);
  const lines = buf.toString('latin1').split('\n');
  lines.pop();
  let first = 0;
  if (lines[0] === FUNDING_HEADER) first = 1;
  else if (!/^\d/.test(lines[0] ?? '')) fail(`${file}: unknown header (expected the exact Vision header or a numeric first row)`);
  const sealedPart = reason => fail(`${file}: ${reason}`);
  const settlementTime = [], calcTime = [], rate = [], rateDecimal = [], intervalHours = [];
  let previous = -Infinity;
  for (let n = first; n < lines.length; n++) {
    const line = lines[n], comma = line.indexOf(','), field = comma < 0 ? line : line.slice(0, comma);
    const rowFail = reason => wholly ? sealedPart(`${reason} in the sealed part`) : fail(`${file}: row ${n + 1}: ${reason}`);
    const t = /^\d{13}$/.test(field) ? Number(field) : NaN;
    if (Number.isNaN(t)) {
      if (previous >= sealMs || wholly) sealedPart('calc_time unreadable in the sealed part');
      if (sealable) sealedPart('calc_time unreadable in the research or sealed part');
      rowFail('calc_time is not 13 digits');
    }
    if (t < source.startMs || t >= source.endMs) {
      if (t >= sealMs || previous >= sealMs) sealedPart('calc_time outside the file month in the sealed part');
      rowFail('calc_time outside the file month');
    }
    if (t <= previous) {
      if (previous >= sealMs) sealedPart('calc_time order broken in the sealed part');
      rowFail('calc_time not after the previous row');
    }
    previous = t;
    if (t >= sealMs) continue; // sealed: nothing but calc_time is read
    const fields = line.split(',');
    if (fields.length !== 3) rowFail(`expected 3 fields, found ${fields.length}`);
    const offset = t % HOUR_MS;
    if (offset >= MAX_OFFSET_MS) rowFail('calc_time is not within 15,000 ms after the full hour');
    if (settlementTime.length && settlementTime.at(-1) === t - offset) rowFail('two rows in one settlement hour');
    const h = INTERVAL_TOKENS.get(fields[1]);
    if (h === undefined) rowFail('interval not one of 1, 2, 4, 8');
    let exact;
    try { exact = canonicalRate(fields[2]); } catch (error) { rowFail(error.message.replace('Vision funding: ', '')); }
    settlementTime.push(t - offset); calcTime.push(t); intervalHours.push(h); rateDecimal.push(exact.decimal); rate.push(Number(exact.decimal));
  }
  return Object.freeze({
    file, rowCount: calcTime.length,
    columns: Object.freeze({ settlementTime: Float64Array.from(settlementTime), calcTime: Float64Array.from(calcTime), rate: Float64Array.from(rate),
      intervalHours: Uint8Array.from(intervalHours) }),
    rateDecimal: Object.freeze(rateDecimal),
  });
}

// One verified source: the zip against its CHECKSUM, its one member by name (CRC and sizes checked), then the rows.
export function parseFundingZip(zipBytes, checksumText, source, options) {
  verifyZip(zipBytes, checksumText, source.zipName);
  return parseFunding(readZipMember(zipBytes, source.csvName), source, options);
}

// The distinct sources of planned units, in time order (the split 2025-10 month gives one source).
const sourcesOf = units => [...new Map(units.flatMap(u => u.sources).map(s => [s.file, s])).values()];
const monthOf = source => new Date(source.startMs).toISOString().slice(0, 7);

// Fetches every planned funding source (plan section h): CHECKSUM first, verified zips stored as versions, 404 on both
// recorded. A month with more than one local version fails closed until a version-selection rule exists. Misses are
// not_listed by the F1a-2 listing rule over the whole plan, else gaps (exit 3). No file is parsed here.
export async function downloadFunding({ symbols, zipRoot }, guard, deps) {
  const counts = { expected: 0, downloaded: 0, skipped: 0, verified: 0, gaps: 0, notListed: 0, failed: 0 };
  const gaps = [], notListed = {}, versionConflicts = [], repaired = [], failures = [];
  for (const symbol of symbols) {
    const units = planFundingUnits(symbol), contract = units[0].instrument.contract;
    const fetched = new Set(), misses = [];
    for (const source of sourcesOf(units)) {
      counts.expected++;
      guard.check(`download ${source.file}`);
      try {
        const result = await fetchSource(source, zipRoot, deps, () => fetched.add(source.file));
        if (result.status === 'missing') { misses.push(source); continue; }
        counts[result.status]++;
        if (result.repaired) repaired.push(source.checksumFile);
        if (localVersions(zipRoot, source).length > 1) { counts.failed++; versionConflicts.push(source.file); continue; }
        counts.verified++;
      } catch (error) {
        counts.failed++;
        failures.push({ file: source.file, error: error.message });
      }
    }
    const listing = notListedSources(units, { zipRoot, fetched });
    for (const source of misses) {
      if (listing.has(source.file)) { (notListed[contract] ??= []).push(monthOf(source)); counts.notListed++; }
      else { gaps.push(source.file); counts.gaps++; }
    }
  }
  return { command: 'download', status: counts.failed ? 'failed' : counts.gaps ? 'incomplete' : 'ok', counts, gaps, notListed, versionConflicts, repaired, failures };
}

// Schedule check (contract section 2) of a settlement r = {t, h} against its predecessor p (null: none known). Returns
// null (no predecessor, on its grid), 'regular', 'interval_change' or 'bridge' (pass), or one of STOP_CLASSES. Grids
// are anchored at 00:00 UTC; 24 is a multiple of every interval, so epoch hours give the hour of the day modulo h.
export const STOP_CLASSES = Object.freeze(['off_grid', 'unexplained_gap', 'unexplained_change']);
export function scheduleClass(p, r) {
  if ((r.t / HOUR_MS) % r.h !== 0) return 'off_grid';
  if (!p) return null;
  const d = (r.t - p.t) / HOUR_MS;
  if (p.h === r.h) return d === r.h ? 'regular' : 'unexplained_gap';
  if (d === p.h || d === r.h) return 'interval_change';
  if (p.h === 1 && r.h === 4 && d > 1 && d < 4) return 'bridge'; // bridge to the new grid: r is on the 4 h grid (checked above)
  return 'unexplained_change';
}

// The first research 1m candle of a contract in the F1a-2 manifest (contract section 3), or null without one.
export function firstCandleOf(manifestPath, contract) {
  const times = readManifest(manifestPath).entries.filter(e => e.contract === contract && e.period === 'research' && e.rowCount > 0).map(e => Date.parse(e.firstOpenTime));
  return times.length ? Math.min(...times) : null;
}

// The one verified local version of a source, or why there is none: missing, conflict (more than one version until a
// version-selection rule exists) or failed (its CHECKSUM).
function loadSource(zipRoot, source) {
  const versions = localVersions(zipRoot, source);
  if (!versions.length) return { status: 'missing' };
  if (versions.length > 1) return { status: 'conflict', error: 'more than one local version' };
  try { return { status: 'verified', sha256: versions[0], zip: readVerifiedSource(zipRoot, source, versions[0]) }; }
  catch (error) { return { status: 'failed', error: error.message }; }
}

const RESEARCH_START_MS = Date.parse(PERIODS.research[0]);
const iso = t => new Date(t).toISOString();
const timeOf = x => x.time ?? x.start;
const byTime = (a, b) => timeOf(a) < timeOf(b) ? -1 : timeOf(a) > timeOf(b) ? 1 : 0;

// The research history of an instrument (contract sections 2 and 3): its research sources 2021-10..2025-10 in month
// order, research-parsed (sealed rows give calc_time only); the 2021-10 rows before the window are predecessor evidence
// only. Every research settlement is checked against its predecessor unless a gap or failed month lies between them
// (then elapsedHours is NaN, meaning null). Edges: an instrument without rows before the window needs its first
// settlement at the first grid point of its interval after its first 1m candle; the last settlement must lie within
// its interval of 2025-10-17T00:00Z; a listed file without research settlements stops. Reads no holdout field.
export function researchHistory(symbol, { zipRoot, firstCandle = () => null, check = () => {} }) {
  const units = planFundingUnits(symbol), instrument = units[0].instrument;
  const research = units.filter(u => u.period === 'research');
  const listing = notListedSources(units, { zipRoot });
  const sources = [], notListed = [], gaps = [], failures = [], coverage = [], anomalies = [], changes = [];
  const columns = { settlementTime: [], calcTime: [], rate: [], rateDecimal: [], intervalHours: [], elapsedHours: [], sourceIndex: [] };
  let previous = null, broken = false, prior = false, firstListed = null, missingFirst = false;
  for (const unit of research) {
    const source = unit.sources[0];
    check(`research ${source.file}`);
    const loaded = loadSource(zipRoot, source);
    if (loaded.status === 'missing') {
      if (listing.has(source.file)) { notListed.push(monthOf(source)); continue; }
      gaps.push(source.file);
      coverage.push({ kind: 'gap_month', start: unit.dataStart, end: unit.dataEnd, file: source.file });
      if (!firstListed) missingFirst = true;
      broken = true;
      continue;
    }
    firstListed ??= source;
    let parsed;
    try {
      if (loaded.status !== 'verified') throw new Error(loaded.error);
      parsed = parseFunding(readZipMember(loaded.zip, source.csvName), source);
    } catch (error) { failures.push({ file: source.file, error: error.message }); broken = true; continue; }
    const index = sources.push({ file: source.file, sha256: loaded.sha256 }) - 1;
    const c = parsed.columns;
    let inWindow = 0;
    for (let i = 0; i < parsed.rowCount; i++) {
      const r = { t: c.settlementTime[i], h: c.intervalHours[i] };
      if (r.t < unit.startMs) { previous = r; broken = false; prior = true; continue; }
      const p = broken ? null : previous, cls = scheduleClass(p, r), elapsed = p ? (r.t - p.t) / HOUR_MS : NaN;
      if (STOP_CLASSES.includes(cls)) anomalies.push({ time: iso(r.t), class: cls, intervalHours: r.h, ...(p && { previous: iso(p.t), previousIntervalHours: p.h, elapsedHours: elapsed }) });
      else if (cls === 'interval_change' || cls === 'bridge') changes.push({ time: iso(r.t), class: cls, old: p.h, new: r.h, elapsedHours: elapsed });
      columns.settlementTime.push(r.t); columns.calcTime.push(c.calcTime[i]); columns.rate.push(c.rate[i]); columns.rateDecimal.push(parsed.rateDecimal[i]);
      columns.intervalHours.push(r.h); columns.elapsedHours.push(elapsed); columns.sourceIndex.push(index);
      previous = r; broken = false; inWindow++;
    }
    if (!inWindow) anomalies.push({ time: unit.dataStart, class: 'empty_file', file: source.file });
  }
  const n = columns.settlementTime.length;
  if (n && !prior && !missingFirst) {
    const first = { t: columns.settlementTime[0], h: columns.intervalHours[0] }, candle = firstCandle(instrument.contract);
    if (notListed.length) coverage.push({ kind: 'before_listing', start: iso(RESEARCH_START_MS), end: iso(firstListed.startMs) });
    if (candle === null || candle === undefined) anomalies.push({ time: iso(first.t), class: 'first_settlement_unproven', reason: 'no first 1m candle' });
    else {
      const step = first.h * HOUR_MS, expected = (Math.floor(candle / step) + 1) * step;
      coverage.push({ kind: 'before_first_charge', start: iso(candle), end: iso(first.t) });
      if (first.t !== expected) anomalies.push({ time: iso(first.t), class: 'first_settlement_unproven', expected: iso(expected) });
    }
  }
  if (n && sources.at(-1).file === research.at(-1).sources[0].file) {
    const t = columns.settlementTime[n - 1], h = columns.intervalHours[n - 1];
    if (SEAL_MS - t > h * HOUR_MS) anomalies.push({ time: iso(t), class: 'trailing_edge', intervalHours: h });
  }
  return { instrument, planned: research.length, sources, notListed, gaps, failures, coverage: coverage.sort(byTime), anomalies: anomalies.sort(byTime), changes, columns };
}

// Holdout integrity (amendment 1 A1): per holdout unit ("2025-10 sealed part", then 2025-11..2026-09) only availability,
// CHECKSUM and pass or fail. Every field of every row is parsed (sealMs = Infinity) and every holdout settlement is
// checked against its predecessor; the boundary pair (last research settlement, first holdout settlement) belongs to
// "2025-10 sealed part". A unit fails when it is missing, unreadable or empty, when a check fails, or when its first
// predecessor is unknown (the previous file missing or unreadable). Errors are dropped: nothing else leaves this path.
export function checkHoldout(symbol, { zipRoot, lastResearch = null, check = () => {} }) {
  let previous = lastResearch;
  return planFundingUnits(symbol).filter(u => u.period === 'holdout').map(unit => {
    const source = unit.sources[0], name = source.startMs < SEAL_MS ? '2025-10 sealed part' : monthOf(source);
    check(`holdout ${unit.instrument.contract} ${name}`);
    const loaded = loadSource(zipRoot, source);
    const checksum = loaded.status === 'verified' ? 'verified' : loaded.status === 'failed' ? 'failed' : 'not checked';
    let pass = false, last = null;
    try {
      if (loaded.status !== 'verified') throw new Error('unavailable');
      const c = parseFunding(readZipMember(loaded.zip, source.csvName), source, { sealMs: Infinity }).columns;
      let p = previous, ok = true, count = 0;
      for (let i = 0; i < c.settlementTime.length; i++) {
        const r = { t: c.settlementTime[i], h: c.intervalHours[i] };
        if (r.t >= SEAL_MS) { count++; if (!p || STOP_CLASSES.includes(scheduleClass(p, r))) ok = false; }
        p = r;
      }
      last = p;
      pass = ok && count > 0;
    } catch { pass = false; }
    previous = last;
    return { unit: name, available: loaded.status !== 'missing', checksum, result: pass ? 'pass' : 'fail' };
  });
}

// verify (plan section i): offline, per symbol the research history and the holdout integrity. status: failed (a research
// file or a holdout unit fails), stopped (a research anomaly: amendment needed), incomplete (a gap month), else ok.
export function verifyFunding({ symbols, zipRoot, firstCandle = () => null, guard = { check() {} } }) {
  const check = label => guard.check(label);
  const out = symbols.map(symbol => {
    const h = researchHistory(symbol, { zipRoot, firstCandle, check }), t = h.columns.settlementTime, n = t.length;
    const holdout = checkHoldout(symbol, { zipRoot, lastResearch: n ? { t: t[n - 1], h: h.columns.intervalHours[n - 1] } : null, check });
    let offsetMaxMs = 0;
    for (let i = 0; i < n; i++) offsetMaxMs = Math.max(offsetMaxMs, h.columns.calcTime[i] - t[i]);
    return { contract: h.instrument.contract, sources: { planned: h.planned, verified: h.sources.length, notListed: h.notListed.length, gaps: h.gaps.length, failed: h.failures.length },
      researchSettlements: n, firstSettlement: n ? iso(t[0]) : null, lastSettlement: n ? iso(t[n - 1]) : null, offsetMaxMs: n ? offsetMaxMs : null,
      changes: h.changes, notListed: h.notListed, gaps: h.gaps, failures: h.failures, coverage: h.coverage, anomalies: h.anomalies, holdout };
  });
  const status = out.some(s => s.failures.length || s.holdout.some(u => u.result === 'fail')) ? 'failed'
    : out.some(s => s.anomalies.length) ? 'stopped' : out.some(s => s.gaps.length) ? 'incomplete' : 'ok';
  return { command: 'verify', status, symbols: out };
}

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const COMMANDS = ['download', 'verify'];
const FLAGS = ['--symbols', '--data-dir', '--manifest', '--max-rss-mib'];
const usage = message => Object.assign(new Error(message), { usage: true });
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
  return { command, symbols, maxRssMiB, zipRoot: path.join(dataDir, 'vision'),
    manifestPath: path.resolve(flags['--manifest'] ?? path.join(ROOT, 'results', 'manifest-f1-1m.json')) };
}

const EXIT = { ok: 0, failed: 1, stopped: 1, usage: 2, incomplete: 3 };
export async function main(argv, deps = {}) {
  const io = { fetch: deps.fetch ?? globalThis.fetch, stdout: deps.stdout ?? process.stdout, sleep: deps.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))) };
  let summary, guard;
  try {
    const options = parseArgs(argv);
    guard = memoryGuard(options.maxRssMiB, deps.check);
    try {
      summary = options.command === 'download' ? await downloadFunding(options, guard, io)
        : verifyFunding({ ...options, firstCandle: contract => firstCandleOf(options.manifestPath, contract), guard });
    } catch (error) {
      summary = { command: options.command, status: 'failed', error: error.message };
    }
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
