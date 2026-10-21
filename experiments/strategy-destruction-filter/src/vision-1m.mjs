#!/usr/bin/env node
// F1a-2 Binance Vision USD-M 1m CLI (docs/f1/f1a-2-contract.md, A8, A10). Unattended, no TTY, Node built-ins only.
//   node src/vision-1m.mjs download|verify|build|compare [--symbols BTC,ETH,SOL,XRP,DOGE,HYPE] [--from YYYY-MM] [--to YYYY-MM]
//     [--data-dir DIR] [--manifest FILE] [--max-rss-mib N (1..512)]
// Symbols are config symbols (BTC), never contracts. Months are inclusive source months inside 2021-10..2026-10.
// download is the only network step: sequential HTTPS GETs to data.binance.vision, finite retries, CHECKSUM first.
// Each verified monthly file is parsed once to derive its fill days (amendment round 5), fetched the same way; a 404
// on both files of a fill day is "fill unavailable", never a gap.
// verify, build and compare are offline. JSON summary on stdout (counts, times, hashes, relative Vision paths only).
// Exit: 0 ok and complete, 1 any mismatch or failure, 2 usage error, 3 finished but a source file is missing.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { planUnits, visionInstrument, parseChecksum, readZipMember, parseKlines, fillSources, MAX_MEMBER_BYTES, VISION_SYMBOLS } from './vision-source.mjs';
import { storeSource, persistChecksum, recordMissing, localVersions, notListedSources, buildStore, verifyStore, compareStore, readManifest } from './f1-1m-store.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const VISION_ORIGIN = 'https://data.binance.vision';
export const CEILING_MIB = 512;
const ATTEMPTS = 4, BACKOFF_MS = 1000, PAUSE_MS = 200, MAX_REDIRECTS = 3;
const TIMEOUT_MS = { checksum: 20000, zip: 120000 }, MAX_BYTES = { checksum: 4096, zip: MAX_MEMBER_BYTES };
const COMMANDS = ['download', 'verify', 'build', 'compare'];
const FLAGS = ['--symbols', '--from', '--to', '--data-dir', '--manifest', '--max-rss-mib'];
const usage = message => Object.assign(new Error(message), { usage: true });
const final = message => Object.assign(new Error(message), { final: true });

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
  const from = flags['--from'] ?? '2021-10', to = flags['--to'] ?? '2026-10';
  for (const symbol of symbols) { visionInstrument(symbol); planUnits(symbol, { from, to }); }
  const maxRssMiB = flags['--max-rss-mib'] === undefined ? CEILING_MIB : Number(flags['--max-rss-mib']);
  if (!Number.isSafeInteger(maxRssMiB) || maxRssMiB < 1 || maxRssMiB > CEILING_MIB) throw usage(`--max-rss-mib must be an integer 1..${CEILING_MIB} (the ceiling can only be lowered)`);
  const dataDir = path.resolve(flags['--data-dir'] ?? path.join(ROOT, 'data'));
  return { command, symbols, from, to, maxRssMiB, zipRoot: path.join(dataDir, 'vision'), cacheDir: path.join(dataDir, 'market-cache', 'f1-1m'),
    manifestPath: path.resolve(flags['--manifest'] ?? path.join(ROOT, 'results', 'manifest-f1-1m.json')) };
}

// RSS is checked at every step and by a timer while the event loop is free; maxRSS is checked once more at the end.
// injected(label) runs first at every check: an internal test seam (main's deps.check), never a CLI option.
function memoryGuard(ceilingMiB, injected = () => {}) {
  const limit = ceilingMiB * 2 ** 20, samples = [];
  let tripped = null;
  const timer = setInterval(() => { const rss = process.memoryUsage.rss(); if (rss > limit) tripped ??= rss; }, 250);
  timer.unref();
  const mib = bytes => Math.round(bytes / 2 ** 20);
  return {
    check(label) {
      injected(label);
      const rss = process.memoryUsage.rss();
      samples.push(rss);
      if (rss > limit || tripped) throw new Error(`memory ceiling exceeded: ${mib(Math.max(rss, tripped ?? 0))} MiB > ${ceilingMiB} MiB at ${label}`);
    },
    stop() { clearInterval(timer); },
    report() {
      const maxRssMiB = Math.round(process.resourceUsage().maxRSS / 1024);
      return { ceilingMiB, maxRssMiB, rssMiB: samples.length ? { checks: samples.length, first: mib(samples[0]), last: mib(samples.at(-1)), max: mib(Math.max(...samples)) } : null };
    }
  };
}

// One GET with redirects restricted to the Vision host over HTTPS, a per-request timeout and a size cap.
async function fetchOnce(url, kind, fetchImpl) {
  let current = new URL(url);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.origin !== VISION_ORIGIN) throw final(`refused ${current.protocol}//${current.host}: only ${VISION_ORIGIN}`);
    const response = await fetchImpl(current.href, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS[kind]) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw final(`redirect ${response.status} without a location`);
      current = new URL(location, current);
      continue;
    }
    if (response.status !== 200) return { status: response.status };
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > MAX_BYTES[kind]) throw final(`${kind} of ${declared} bytes over the ${MAX_BYTES[kind]} byte cap`);
    const chunks = [];
    let size = 0;
    if (response.body) for await (const chunk of response.body) {
      size += chunk.length;
      if (size > MAX_BYTES[kind]) throw final(`${kind} body over the ${MAX_BYTES[kind]} byte cap`);
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks.map(c => Buffer.from(c)));
    if (declared !== null && Number(declared) !== bytes.length) throw new Error(`truncated body (${bytes.length} of ${declared} bytes)`);
    return { status: 200, bytes };
  }
  throw final(`more than ${MAX_REDIRECTS} redirects`);
}
// 200 -> bytes, 404 -> definitive miss; 5xx, 429, timeouts, network errors and truncated bodies are retried, then fail.
async function get(file, kind, { fetch: fetchImpl, sleep }) {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(BACKOFF_MS * 2 ** (attempt - 2));
    try {
      const result = await fetchOnce(`${VISION_ORIGIN}/${file}`, kind, fetchImpl);
      if (result.status === 200 || result.status === 404) return result;
      if (result.status < 500 && result.status !== 429) throw final(`HTTP ${result.status}`);
      last = `HTTP ${result.status}`;
    } catch (error) {
      if (error.final) throw new Error(`${file}: ${error.message}`);
      last = error.name === 'TimeoutError' ? 'timeout' : error.cause?.code ?? error.message;
    }
  }
  throw new Error(`${file}: ${last} after ${ATTEMPTS} attempts`);
}

// One source, CHECKSUM first: 'missing' (404 on both, marker written), 'skipped' (the matching verified local
// version, its CHECKSUM repaired if needed) or 'downloaded'. Returns the verified zip bytes; anything else throws.
// exists(withChecksum) is called as soon as the source is known to exist.
async function fetchSource(source, zipRoot, deps, exists) {
  await deps.sleep(PAUSE_MS);
  const checksum = await get(source.checksumFile, 'checksum', deps);
  if (checksum.status === 404) {
    const zip = await get(source.file, 'zip', deps);
    if (zip.status === 404) { recordMissing(zipRoot, source); return { status: 'missing' }; }
    exists(false);
    throw new Error(`${source.file}: CHECKSUM 404 but the zip exists`);
  }
  exists(true);
  const text = checksum.bytes.toString('latin1');
  const sha = parseChecksum(text, source.zipName);
  if (localVersions(zipRoot, source).includes(sha)) {
    const local = fs.readFileSync(path.join(zipRoot, path.dirname(source.file), sha, source.zipName));
    if (createHash('sha256').update(local).digest('hex') !== sha) throw new Error(`${source.file}: stored copy fails its CHECKSUM`);
    // A missing or corrupt local CHECKSUM (a crash between the two writes of an older store) is restored.
    return { status: 'skipped', bytes: local, repaired: persistChecksum(zipRoot, source, sha, text) };
  }
  const zip = await get(source.file, 'zip', deps);
  if (zip.status === 404) throw new Error(`${source.file}: zip 404 but the CHECKSUM exists`);
  storeSource(zipRoot, source, zip.bytes, text);
  return { status: 'downloaded', bytes: zip.bytes, repaired: false };
}

async function download({ symbols, from, to, zipRoot, manifestPath }, guard, deps) {
  // The 1m manifest is listing evidence, read without the lock: an absent file has no entries; an unreadable or
  // invalid one stops the run before any request (never a silent "no evidence").
  let entries;
  try { entries = readManifest(manifestPath).entries; }
  catch (error) { throw new Error(`the 1m manifest (listing evidence) cannot be read: ${error.code ?? error.message}`); }
  // Base counts are transport outcomes: verified = downloaded + skipped and verified + gaps + notListed + failed =
  // expected. Fill sources and monthly parse failures are counted apart (plan approval point 2).
  const counts = { expected: 0, downloaded: 0, skipped: 0, verified: 0, gaps: 0, notListed: 0, failed: 0 };
  const fillCounts = { expected: 0, downloaded: 0, skipped: 0, verified: 0, unavailable: 0, failed: 0, monthlyParseFailed: 0 };
  const gaps = [], notListed = {}, firstFiles = {}, repaired = [], failures = [], unavailable = [];
  const failure = (source, error) => failures.push(error.message.startsWith(source.file) ? error.message : `${source.file}: ${error.message}`);
  // Memory guard checks stay outside every try: a trip aborts the run, never a per-source failure.
  for (const symbol of symbols) {
    const contract = VISION_SYMBOLS[symbol];
    const units = planUnits(symbol, { from, to });
    const sources = [...new Map(units.flatMap(u => u.sources).map(s => [s.file, s])).values()];
    const misses = [], fetched = new Set();
    for (const source of sources) {
      counts.expected++;
      guard.check(source.file);
      let bytes;
      try {
        const result = await fetchSource(source, zipRoot, deps, withChecksum => {
          fetched.add(source.file);
          if (withChecksum) firstFiles[contract] ??= source.file;
        });
        if (result.status === 'missing') { misses.push(source); continue; }
        if (result.repaired) repaired.push(source.checksumFile);
        counts[result.status]++; counts.verified++;
        bytes = result.bytes;
      } catch (error) {
        counts.failed++;
        failure(source, error);
        continue;
      }
      if (source.kind !== 'monthly') continue;
      // The fill days of this monthly file's units (F1, F2): one parse of the verified bytes (fresh or cached),
      // released before the fill requests.
      guard.check(`parse ${source.file}`);
      let openTime;
      try { openTime = parseKlines(readZipMember(bytes, source.csvName), source).columns.open_time; }
      catch (error) { fillCounts.monthlyParseFailed++; failure(source, error); continue; }
      bytes = null;
      guard.check(`parsed ${source.file}`);
      const fills = units.filter(u => u.sources.some(s => s.file === source.file)).flatMap(u => fillSources(u, openTime));
      openTime = null;
      for (const fill of fills) {
        fillCounts.expected++;
        guard.check(`fill ${fill.file}`);
        try {
          const result = await fetchSource(fill, zipRoot, deps, () => {});
          if (result.status === 'missing') { fillCounts.unavailable++; unavailable.push(fill.file); continue; }
          if (result.repaired) repaired.push(fill.checksumFile);
          fillCounts[result.status]++; fillCounts.verified++;
        } catch (error) {
          fillCounts.failed++;
          failure(fill, error);
        }
      }
    }
    // Listing rule (D6 as amended 2026-10-21): evidence over the whole F1a range, not only the requested months.
    const listing = notListedSources(symbol, { zipRoot, entries, fetched });
    for (const source of misses) {
      if (listing.has(source.file)) { (notListed[contract] ??= []).push(new Date(source.startMs).toISOString().slice(0, 7)); counts.notListed++; }
      else { gaps.push(source.file); counts.gaps++; }
    }
  }
  const failed = counts.failed || fillCounts.failed || fillCounts.monthlyParseFailed;
  return { command: 'download', status: failed ? 'failed' : counts.gaps ? 'incomplete' : 'ok', counts, gaps, notListed, firstFiles, repaired, failures,
    fills: { counts: fillCounts, unavailable } };
}

function verify(options) {
  const summary = verifyStore(options);
  let entries = [];
  try { entries = readManifest(options.manifestPath).entries; } catch { entries = []; }
  const coverage = [...new Set(entries.map(e => e.contract))].map(contract => {
    const own = entries.filter(e => e.contract === contract).sort((a, b) => a.dataStart < b.dataStart ? -1 : 1);
    return { contract, entries: own.length, firstCandle: own[0].firstOpenTime, lastCandle: own.at(-1).lastOpenTime,
      bars: own.reduce((n, e) => n + e.rowCount, 0), missingMinutes: own.reduce((n, e) => n + e.missingMinutes, 0) };
  });
  return { ...summary, coverage };
}

const EXIT = { ok: 0, failed: 1, usage: 2, incomplete: 3 };
export async function main(argv, deps = {}) {
  const io = { fetch: deps.fetch ?? globalThis.fetch, stdout: deps.stdout ?? process.stdout, sleep: deps.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))) };
  let summary, guard;
  try {
    const options = parseArgs(argv);
    guard = memoryGuard(options.maxRssMiB, deps.check);
    try {
      if (options.command === 'download') summary = await download(options, guard, io);
      else if (options.command === 'build') { const { entries, units, ...rest } = buildStore({ ...options, guard }); summary = rest; void entries; void units; }
      else if (options.command === 'verify') summary = verify({ ...options, guard });
      else summary = compareStore({ ...options, guard });
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
