// D-h (2026-11-02): LIMITS.errorBody is frozen at 65536 after the probe-r1 run; evidence docs/f1/probe-r1-2026-11-02/ (notfound.csv: real 404 bodies 340-379 bytes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS } from '../m9-scan.mjs';

test('D-h: LIMITS.errorBody imported from m9-scan.mjs is strictly equal to the number 65536', () => {
 assert.strictEqual(LIMITS.errorBody, 65536);
});
