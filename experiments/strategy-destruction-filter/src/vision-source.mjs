// F1a-2 Binance Vision source files (docs/f1/f1a-2-contract.md): ZIP member, CHECKSUM, kline CSV rows, units.
// Node built-ins only. Every check fails closed: a file that fails gives no rows at all.
import zlib from 'node:zlib';

export const MAX_MEMBER_BYTES = 64 * 1024 * 1024;
const fail = message => { throw new Error(`Vision zip: ${message}`); };

// The one expected member of a Vision zip, located through the end record and the central directory. Only the
// variant seen in real files is accepted: one member, deflate, no flags, no zip64.
export function readZipMember(bytes, expectedName, { maxBytes = MAX_MEMBER_BYTES } = {}) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50 && i + 22 + buf.readUInt16LE(i + 20) === buf.length) { eocd = i; break; }
  }
  if (eocd < 0) fail('no end record (truncated or not a zip)');
  const entries = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOffset = buf.readUInt32LE(eocd + 16);
  if (buf.readUInt16LE(eocd + 4) || buf.readUInt16LE(eocd + 6) || buf.readUInt16LE(eocd + 8) !== entries) fail('multi-disk zip');
  if (entries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) fail('zip64 not supported');
  if (entries !== 1) fail(`expected exactly one member, found ${entries}`);
  if (cdOffset + cdSize !== eocd || cdSize < 46) fail('central directory out of place');
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) fail('bad central directory header');
  const flags = buf.readUInt16LE(cdOffset + 8), method = buf.readUInt16LE(cdOffset + 10), crc = buf.readUInt32LE(cdOffset + 16);
  const packedSize = buf.readUInt32LE(cdOffset + 20), size = buf.readUInt32LE(cdOffset + 24);
  const nameLength = buf.readUInt16LE(cdOffset + 28), localOffset = buf.readUInt32LE(cdOffset + 42);
  if (46 + nameLength + buf.readUInt16LE(cdOffset + 30) + buf.readUInt16LE(cdOffset + 32) !== cdSize) fail('central directory size mismatch');
  const name = buf.toString('latin1', cdOffset + 46, cdOffset + 46 + nameLength);
  if (name !== expectedName) fail(`unexpected member ${JSON.stringify(name)}, expected ${expectedName}`);
  if (packedSize === 0xffffffff || size === 0xffffffff) fail('zip64 not supported');
  if (flags !== 0) fail(`unsupported flags ${flags}`);
  if (method !== 8) fail(`unsupported compression method ${method}`);
  if (size > maxBytes) fail(`member of ${size} bytes over the ${maxBytes} byte cap`);
  if (localOffset + 30 > cdOffset || buf.readUInt32LE(localOffset) !== 0x04034b50) fail('bad local header');
  const localName = buf.readUInt16LE(localOffset + 26), localExtra = buf.readUInt16LE(localOffset + 28);
  if (buf.readUInt16LE(localOffset + 6) !== flags || buf.readUInt16LE(localOffset + 8) !== method || localName !== nameLength
    || buf.toString('latin1', localOffset + 30, localOffset + 30 + localName) !== name) fail('local header disagrees with the central directory');
  const start = localOffset + 30 + localName + localExtra;
  if (start + packedSize > cdOffset) fail('member data runs into the central directory');
  let out;
  try { out = zlib.inflateRawSync(buf.subarray(start, start + packedSize), { maxOutputLength: maxBytes }); }
  catch (error) { fail(error.code === 'ERR_BUFFER_TOO_LARGE' ? `member inflates over the ${maxBytes} byte cap` : `inflate failed (${error.code ?? error.message})`); }
  if (out.length !== size) fail(`uncompressed size ${out.length} != declared ${size}`);
  if (zlib.crc32(out) !== crc) fail('CRC32 mismatch');
  return out;
}
