// D-09 probe: v6.2 S3: available if 2025-08 and 2025-09 are verified_nonempty and ONE SEGMENT holds a row <= 2025-08-31T08:00Z
// and a row >= 2025-09-01T04:00Z (the rows may lie in other months of that segment).
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, status, csv, time } from './support.mjs';

const H = 'symbol,segment,calc_time,funding_interval_hours,status\n';
test('D-09: July row before the window in the same segment, August first row inside it: v6.2 S3 says available', async () => {
 const r = await run(sources([
  { symbol: 'TREEUSDT', month: '2025-07', body: csv(['2025-07-31T16:00Z', 8]) },
  { symbol: 'TREEUSDT', month: '2025-08', body: csv(['2025-08-31T16:00Z', 8]) },
  { symbol: 'TREEUSDT', month: '2025-09', body: csv(['2025-09-01T08:00Z', 8]) }]));
 for (const m of ['2025-07', '2025-08', '2025-09']) status(r, 'TREEUSDT', m, 'verified_nonempty');
 assert.equal(text(r, 'tree_control.csv'), H + 'TREEUSDT,1,' + time('2025-08-31T16:00Z') + ',8,available\n');
});
test('D-09: October row after the window in the same segment, September last row inside it: v6.2 S3 says available', async () => {
 const r = await run(sources([
  { symbol: 'TREEUSDT', month: '2025-08', body: csv(['2025-08-31T08:00Z', 8]) },
  { symbol: 'TREEUSDT', month: '2025-09', body: csv(['2025-09-01T00:00Z', 8]) },
  { symbol: 'TREEUSDT', month: '2025-10', body: csv(['2025-10-01T00:00Z', 8]) }]));
 for (const m of ['2025-08', '2025-09', '2025-10']) status(r, 'TREEUSDT', m, 'verified_nonempty');
 assert.equal(text(r, 'tree_control.csv'), H + 'TREEUSDT,1,' + time('2025-08-31T08:00Z') + ',8,available\nTREEUSDT,1,' + time('2025-09-01T00:00Z') + ',8,available\n');
});
