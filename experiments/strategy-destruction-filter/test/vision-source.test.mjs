// F1a-2: Binance Vision source files: ZIP member, CHECKSUM, kline CSV rows and units (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readZipMember } from '../src/vision-source.mjs';
import { makeZip, klineCsv, minutes } from '../test-support/vision-fixtures.mjs';

const NAME = 'BTCUSDT-1m-2024-01.csv';
const CSV = klineCsv(minutes('2024-01-01T00:00:00.000Z', 3));

test('F1a-2 zip: returns the one expected deflated member after CRC32 and size checks', () => {
  const out = readZipMember(makeZip([{ name: NAME, data: CSV }]), NAME);
  assert.ok(Buffer.isBuffer(out));
  assert.equal(out.toString('utf8'), CSV);
});

test('F1a-2 zip: rejects a wrong or extra member, a CRC or size mismatch, other methods, flags and zip64, and truncation', () => {
  const reject = (bytes, pattern, options) => assert.throws(() => readZipMember(bytes, NAME, options), pattern);
  reject(makeZip([{ name: 'other.csv', data: CSV }]), /member/);
  reject(makeZip([{ name: NAME, data: CSV }, { name: 'extra.csv', data: CSV }]), /exactly one member/);
  reject(makeZip([{ name: NAME, data: CSV }], { centralName: 'BTCUSDT-1m-2024-02.csv' }), /member/);
  reject(makeZip([{ name: NAME, data: CSV }], { crc: 12345 }), /CRC32/);
  reject(makeZip([{ name: NAME, data: CSV }], { declaredSize: CSV.length + 1 }), /size/);
  reject(makeZip([{ name: NAME, data: CSV }], { declaredSize: CSV.length - 1 }), /size/);
  reject(makeZip([{ name: NAME, data: CSV }], { method: 0 }), /compression method/);
  reject(makeZip([{ name: NAME, data: CSV }], { flags: 1 }), /flags/);
  reject(makeZip([{ name: NAME, data: CSV }], { flags: 8 }), /flags/);
  reject(makeZip([{ name: NAME, data: CSV }], { zip64: true }), /zip64/);
  const good = makeZip([{ name: NAME, data: CSV }]);
  reject(good.subarray(0, good.length - 5), /end record/);
  reject(good.subarray(10), /end record|local header|central/);
  reject(Buffer.from('not a zip at all'), /end record/);
  const corrupt = Buffer.from(good); corrupt[30 + NAME.length + 8] ^= 0xff; // inside the deflate stream
  reject(corrupt, /inflate|CRC32|size/);
});

test('F1a-2 zip: the uncompressed size cap (64 MiB default) applies before and during inflation', () => {
  const zip = makeZip([{ name: NAME, data: CSV }]);
  assert.throws(() => readZipMember(zip, NAME, { maxBytes: CSV.length - 1 }), /cap/);
  // A member that lies about its size cannot inflate past the cap either.
  const bomb = makeZip([{ name: NAME, data: Buffer.alloc(4096, 0x41) }], { declaredSize: 10 });
  assert.throws(() => readZipMember(bomb, NAME, { maxBytes: 100 }), /cap|size/);
  assert.equal(readZipMember(zip, NAME, { maxBytes: CSV.length }).length, CSV.length);
});
