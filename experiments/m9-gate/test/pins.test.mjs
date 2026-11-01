// D-04, D-05, D-06 probe: v6.2 E1 (C38, C42, C47): preflight pin mismatch = rejection with no request, no import, no result;
// a re-hash immediately before the import; the script-stage O13 never contains pin_mismatch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, appendFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { sources, run, closure, listPath, root } from './support.mjs';

const F = 'experiments/strategy-destruction-filter/src/f1-funding.mjs';
const mark = n => '\nglobalThis.__d1probe_' + n + '=(globalThis.__d1probe_' + n + '||0)+1;\n';
const copy = () => { const t = mkdtempSync(join(tmpdir(), 'd1probe-')); cpSync(closure, t, { recursive: true }); return t; };
const drop = t => { assert.ok(t.startsWith(resolve(tmpdir()) + '/d1probe-')); if (existsSync(t)) rmSync(t, { recursive: true }); };
// Preflight rejection (D-04 clarification): nothing under the output path, exit code 4, one stderr line.
const rejected = r => { assert.equal(r.requests.length, 0, 'no network request'); assert.equal(r.code, 4); assert.equal(r.invalid, null); assert.equal(r.partial, false); assert.deepEqual(r.names, []); assert.deepEqual(r.files, {}); assert.deepEqual(r.stderr, ['preflight rejection\n']); };

test('D-04/D-06: a closure hash mismatch at preflight sends no request, imports nothing and writes no result (no O13, so no pin_mismatch)', async () => {
 const t = copy();
 try {
  appendFileSync(join(t, F), mark('pre'));
  const r = await run(sources([{ symbol: 'A', month: '2025-05' }]), { closureRoot: t });
  rejected(r);
  assert.equal(globalThis.__d1probe_pre, undefined, 'changed module was not imported');
 } finally { drop(t); }
});
test('D-04: a Node version other than v24.22.0 is a preflight rejection: no request, no import, no output', async () => {
 const t = copy(), prefix = pathToFileURL(t).href + '/', loaded = [], version = Object.getOwnPropertyDescriptor(process, 'version');
 const hooks = registerHooks({ load(url, context, next) { if (url.startsWith(prefix)) loaded.push(url); return next(url, context); } });
 let r;
 Object.defineProperty(process, 'version', { ...version, value: 'v24.10.0' });
 try { r = await run(sources([{ symbol: 'A', month: '2025-05' }]), { closureRoot: t }); }
 finally { Object.defineProperty(process, 'version', version); hooks.deregister(); drop(t); }
 assert.equal(process.version, 'v24.22.0');
 rejected(r); assert.deepEqual(loaded, [], 'no closure module loaded');
});
test('D-05: a closure file changed after preflight fails the re-hash before the import: F5 invalid marker only, nothing imported', async () => {
 const t = copy();
 try {
  const routes = sources([]), lp = listPath(root), body = routes.get(lp);
  routes.set(lp, () => { appendFileSync(join(t, F), mark('mid')); return body; });
  const r = await run(routes, { closureRoot: t });
  assert.equal(globalThis.__d1probe_mid, undefined, 'file changed during the run was not imported');
  assert.equal(r.code, 3); assert.equal(r.invalid, 'invalid pin_rehash\n'); assert.deepEqual(r.names, ['out0.invalid']); assert.deepEqual(r.files, {});
 } finally { drop(t); }
});
