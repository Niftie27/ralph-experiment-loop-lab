#!/usr/bin/env node
// F1a-3 reference klines (docs/f1/f1a-3-contract.md; plan docs/f1/f1a-3-plan.md sections d, h, i): Binance Vision USD-M
// kline files of higher intervals that the aggregates are checked against. Unattended, no TTY, Node built-ins only.
//   node src/f1-reference.mjs download [--symbols BTC,ETH,SOL,XRP,DOGE,HYPE] [--data-dir DIR] [--manifest FILE] [--max-rss-mib N (1..512)]
// download is the only network step: the verified transport of the 1m files (src/vision-transport.mjs: HTTPS to
// data.binance.vision only, CHECKSUM first, version directories under <data-dir>/vision, 404 markers, finite retries).
// Research files only (V3, approval 7(a)): no monthly file of 2025-10 or later, no daily file from 2025-10-17, and no
// planned file can hold a row that closes after 2025-10-17T00:00Z. JSON summary on stdout (counts and relative Vision
// paths only). Exit: 0 ok, 1 any failure, 2 usage error, 3 finished but a 1h or 4h file is not published.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERIODS } from './h2-contract.mjs';
import { visionInstrument, visionSource, gridOpen, KLINE_INTERVALS, VISION_SYMBOLS } from './vision-source.mjs';
import { fetchSource } from './vision-transport.mjs';
import { CEILING_MIB } from './vision-1m.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RESEARCH_END = Date.parse(PERIODS.research[1]);
// Roles: 1h and 4h decide acceptance, 1d and 1w are reported (approval 4(a)); 5m and 15m are the C3 sample.
export const ROLES = Object.freeze({ '1h': 'deciding', '4h': 'deciding', '1d': 'reported', '1w': 'reported', '5m': 'c3', '15m': 'c3' });
const INTERVALS = Object.keys(ROLES);
// The C3 months, recorded in the contract before any 5m or 15m result was seen.
export const C3_MONTHS = Object.freeze({ BTC: '2022-06', ETH: '2023-03', SOL: '2022-02', XRP: '2023-11', DOGE: '2024-05', HYPE: '2025-08' });
// First month with Vision files (plan section h listing; the 1m months before it are not_listed in F1a-2).
const LISTED_FROM = Object.freeze({ HYPE: '2025-05' });
const FIRST_MONTH = '2021-10', LAST_MONTH = '2025-09', LAST_WEEKLY_MONTH = '2024-01', DAILY_FROM = '2025-10-01', DAILY_TO = '2025-10-16';
const usage = message => Object.assign(new Error(message), { usage: true });
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

const COMMANDS = ['download'];
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
async function download({ symbols, zipRoot }, deps) {
  const counts = Object.fromEntries(INTERVALS.map(i => [i, { expected: 0, downloaded: 0, skipped: 0, verified: 0, missing: 0, failed: 0 }]));
  const missing = [], repaired = [], failures = [];
  for (const symbol of symbols) for (const source of planReferences(symbol)) {
    const c = counts[source.interval];
    c.expected++;
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
  let summary;
  try {
    const options = parseArgs(argv);
    try { summary = await download(options, io); }
    catch (error) { summary = { command: options.command, status: 'failed', error: error.message }; }
    const maxRssMiB = Math.round(process.resourceUsage().maxRSS / 1024);
    if (maxRssMiB > options.maxRssMiB) summary = { ...summary, status: 'failed', error: `memory ceiling exceeded: maxRSS ${maxRssMiB} MiB > ${options.maxRssMiB} MiB` };
    summary = { ...summary, memory: { ceilingMiB: options.maxRssMiB, maxRssMiB }, runtime: { node: process.version, platform: process.platform } };
  } catch (error) {
    if (!error.usage) throw error;
    summary = { command: argv[0] ?? null, status: 'usage', error: error.message };
  }
  io.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  return EXIT[summary.status];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
