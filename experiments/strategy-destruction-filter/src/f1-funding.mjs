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
import { notListedSources, localVersions } from './f1-1m-store.mjs';
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

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const COMMANDS = ['download'];
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
      summary = await downloadFunding(options, guard, io);
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
