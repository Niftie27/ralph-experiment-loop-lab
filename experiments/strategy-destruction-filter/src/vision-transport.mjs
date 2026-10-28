// Verified Binance Vision transport (docs/f1/f1a-2-contract.md, A10), shared by the 1m download and the F1a-3 reference
// download. Moved unchanged from src/vision-1m.mjs (F1a-3 commit 3, contract C2): HTTPS to data.binance.vision only,
// redirects only to that host, per-request timeouts and size caps, finite retries, CHECKSUM first, version directories,
// 404 markers and CHECKSUM repair through the store.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseChecksum, MAX_MEMBER_BYTES } from './vision-source.mjs';
import { storeSource, persistChecksum, recordMissing, localVersions } from './f1-1m-store.mjs';

const VISION_ORIGIN = 'https://data.binance.vision';
const ATTEMPTS = 4, BACKOFF_MS = 1000, PAUSE_MS = 200, MAX_REDIRECTS = 3;
const TIMEOUT_MS = { checksum: 20000, zip: 120000 }, MAX_BYTES = { checksum: 4096, zip: MAX_MEMBER_BYTES };
const final = message => Object.assign(new Error(message), { final: true });

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
export async function fetchSource(source, zipRoot, deps, exists) {
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
