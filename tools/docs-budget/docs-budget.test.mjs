// Size and link checks for the files every agent reads first (decision 45).
// Run from the repo root: node --test tools/docs-budget/docs-budget.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const budgets = { 'docs/MAP.md': 3500, 'docs/findings.md': 8000 };

for (const [file, max] of Object.entries(budgets)) {
  test(`${file} is at most ${max} bytes`, () => {
    const size = statSync(join(root, file)).size;
    assert.ok(size <= max, `${file} has ${size} bytes, cap ${max}: merge or move content instead of growing it`);
  });
}

test('docs/MAP.md states its update date', () => {
  const text = readFileSync(join(root, 'docs/MAP.md'), 'utf8');
  assert.match(text, /^Updated: \d{4}-\d{2}-\d{2}\b/m);
});

test('every path named in docs/MAP.md exists', () => {
  const text = readFileSync(join(root, 'docs/MAP.md'), 'utf8');
  const paths = [...text.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]).filter((p) => p.includes('/') || p.endsWith('.md'));
  assert.ok(paths.length > 0, 'no paths found');
  const missing = paths.filter((p) => !existsSync(join(root, p)));
  assert.deepEqual(missing, []);
});

test('docs/findings.md entry ids are unique', () => {
  const text = readFileSync(join(root, 'docs/findings.md'), 'utf8');
  const ids = [...text.matchAll(/^- \*\*(F\d{2}) /gm)].map((m) => m[1]);
  assert.ok(ids.length > 0, 'no entries found');
  assert.equal(new Set(ids).size, ids.length);
});
