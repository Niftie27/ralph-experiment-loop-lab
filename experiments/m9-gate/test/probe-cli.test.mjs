// m9 review probe (cli): the script as a child process: outputs independent of the process time zone (Definitions use UTC instants),
// and the E1/F6 preflight on the real (unshimmed) Node version: exit 4, no request, nothing written. Local stubs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources, files, csv, closure } from './support.mjs';

const SCAN = fileURLToPath(new URL('../m9-scan.mjs', import.meta.url));
async function cli(routes, env) {
 const requests = [], server = createServer((req, res) => { requests.push(req.url); const v = routes.get(req.url); if (v === undefined) { res.writeHead(404); res.end(); } else { res.writeHead(200); res.end(v); } });
 server.listen(0, '127.0.0.1'); await once(server, 'listening');
 const o = 'http://127.0.0.1:' + server.address().port, temp = mkdtempSync(join(tmpdir(), 'm9cli-')), out = join(temp, 'out');
 try {
  const child = spawn(process.execPath, [SCAN, '--out', out, '--closure-root', closure, '--list-base', o + '/list', '--download-base', o + '/download/', '--pause-ms', '0', '--retry-ms', '0'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = ''; child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
  const [code] = await once(child, 'exit');
  return { code, stdout, stderr, requests, names: readdirSync(temp), files: existsSync(out) ? files(out) : {} };
 } finally { server.closeAllConnections(); server.close(); if (existsSync(temp)) rmSync(temp, { recursive: true }); }
}
const entries = () => [{ symbol: 'A', month: '2025-04', body: csv(['2025-04-30T23:00Z', 1]) }, { symbol: 'A', month: '2025-05', body: csv(['2025-05-01T00:00Z', 1], ['2025-05-02T07:00Z', 1], ['2025-05-02T08:00Z', 1], ['2025-05-31T23:00Z', 8]) }, { symbol: 'A', month: '2025-06', body: csv(['2025-06-01T00:00Z', 1], ['2025-06-01T01:00Z', 1]) }];
test('CLI-1 Definitions: identical output bytes under TZ=UTC and TZ=Pacific/Kiritimati and America/St_Johns', async () => {
 const runs = [];
 for (const TZ of ['UTC', 'Pacific/Kiritimati', 'America/St_Johns']) { const r = await cli(sources(entries()), { ...process.env, TZ }); assert.equal(r.code, 0, r.stderr); runs.push(r); }
 for (const r of runs.slice(1)) { assert.deepEqual(Object.keys(r.files).sort(), Object.keys(runs[0].files).sort()); for (const p of Object.keys(r.files)) assert.ok(r.files[p].equals(runs[0].files[p]), p); }
 assert.match(runs[0].files['summary.txt'].toString(), /\nruns_entry:era1:left_censored_segment 1\n/);
});
test('CLI-2 E1/F6: without the version shim the real Node version is rejected at preflight: exit 4, no request, nothing written', async () => {
 const env = { ...process.env }; delete env.NODE_OPTIONS;
 const r = await cli(sources(entries()), env);
 if (r.code === 0) { assert.ok(process.version === 'v24.22.0', 'shim absent and version not v24.22.0, yet exit 0'); return; }
 assert.equal(r.code, 4); assert.deepEqual(r.requests, []); assert.deepEqual(r.names, []); assert.equal(r.stderr, 'preflight rejection\n'); assert.equal(r.stdout, '');
});
