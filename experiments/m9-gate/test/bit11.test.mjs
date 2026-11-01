// D-01 probe: v6.2 I1 (C34) accepts general-purpose flags exactly 0x0800 when the member name has a byte above 0x7F.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sources, run, text, status, zip, csv } from './support.mjs';

const sym = '币安人生USDT';
const build = (month, flags) => {
 const z = zip(sym + '-fundingRate-' + month + '.csv', csv([month + '-01T00:00Z', 8]));
 const cd = z.readUInt32LE(z.length - 6);
 z.writeUInt16LE(flags, 6); z.writeUInt16LE(flags, cd + 8); // local and central flags equal
 return z;
};

test('CONTROL D-01: the same non-ASCII zip with flags 0 is verified_nonempty', async () => {
 const r = await run(sources([{ symbol: sym, month: '2025-10', zip: build('2025-10', 0) }]));
 assert.equal(r.code, 0); status(r, sym, '2025-10', 'verified_nonempty');
});
for (const month of ['2025-10', '2025-05']) test('D-01 (' + month + '): non-ASCII member with flags 0x0800 in both headers is verified_nonempty (v6.2 I1); outcome by P3, not P0', async () => {
 const r = await run(sources([{ symbol: sym, month, zip: build(month, 0x0800) }]));
 assert.equal(r.code, 0);
 status(r, sym, month, 'verified_nonempty');
 assert.equal(text(r, 'outcome.csv'), 'stage,outcome,reason\nscript,P3,no_hourly_pair_era2\nscript,P3,no_hourly_pair_era3\nscript,P3,no_observed_boundary\n');
});
// D-01 Test field and the D-01 clarification: an ASCII name accepts only 0; 0x0800 in one header only and 0x0808 fail member.
const flagged = (symbol, central, local) => {
 const z = zip(symbol + '-fundingRate-2025-05.csv', csv(['2025-05-01T00:00Z', 8]));
 z.writeUInt16LE(local, 6); z.writeUInt16LE(central, z.readUInt32LE(z.length - 6) + 8);
 return z;
};
for (const [label, symbol, central, local] of [['ASCII name, 0x0800 in both headers', 'A', 0x0800, 0x0800], ['non-ASCII name, 0x0800 central only', sym, 0x0800, 0], ['non-ASCII name, 0x0800 local only', sym, 0, 0x0800], ['non-ASCII name, 0x0808 in both headers', sym, 0x0808, 0x0808], ['ASCII name, 0x0808 in both headers', 'A', 0x0808, 0x0808]])
 test('D-01 (I1 member): ' + label + ' is excluded:member', async () => {
  const r = await run(sources([{ symbol, month: '2025-05', zip: flagged(symbol, central, local) }]));
  assert.equal(r.code, 0); status(r, symbol, '2025-05', 'excluded:member');
 });
