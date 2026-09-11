import { describe, expect, it } from 'vitest';
import {
  ATTR,
  attrBytes,
  attrFloat,
  attrString,
  attrUint32,
  readCasketId,
  type RawAttribute,
} from '../src/domain/attributes.js';

const attr = (defIndex: number, value: Uint8Array): RawAttribute => ({
  def_index: defIndex,
  value_bytes: value,
});

/**
 * Places bytes inside a larger buffer and returns a view over just that
 * window, the way the game coordinator hands back slices of a pooled
 * ArrayBuffer. Everything around the window is filled with noise so that a
 * reader which ignores the offset produces an obviously wrong answer.
 */
function windowInto(
  offset: number,
  length: number,
  fill: (view: DataView) => void,
): Uint8Array {
  const pool = new Uint8Array(128).fill(0xab);
  fill(new DataView(pool.buffer, offset, length));
  return pool.subarray(offset, offset + length);
}

const u32 = (value: number, offset = 0) =>
  windowInto(offset, 4, (view) => view.setUint32(0, value, true));

const f32 = (value: number, offset = 0) =>
  windowInto(offset, 4, (view) => view.setFloat32(0, value, true));

describe('attribute readers', () => {
  it('reads a uint32 and a float from plain Uint8Arrays', () => {
    const attributes = [attr(ATTR.CASKET_ITEM_COUNT, u32(847)), attr(ATTR.PAINT_WEAR, f32(0.2134))];

    expect(attrUint32(attributes, ATTR.CASKET_ITEM_COUNT)).toBe(847);
    expect(attrFloat(attributes, ATTR.PAINT_WEAR)).toBeCloseTo(0.2134, 6);
  });

  it('reads correctly from a view offset into a larger buffer', () => {
    // The trap: reading via `bytes.buffer` without the offset and length would
    // pick up the surrounding noise instead of these four bytes.
    const attributes = [
      attr(ATTR.CASKET_ITEM_COUNT, u32(1234567, 20)),
      attr(ATTR.PAINT_WEAR, f32(0.5, 44)),
      attr(ATTR.PAINT_INDEX, f32(44, 100)),
    ];

    expect(attrUint32(attributes, ATTR.CASKET_ITEM_COUNT)).toBe(1234567);
    expect(attrFloat(attributes, ATTR.PAINT_WEAR)).toBeCloseTo(0.5, 6);
    expect(attrFloat(attributes, ATTR.PAINT_INDEX)).toBeCloseTo(44, 6);
  });

  it('reads from a Node Buffer taken out of the allocation pool', () => {
    // Buffer.from on a short string is pooled, so this Buffer is itself a view
    // at a non-zero offset into a shared ArrayBuffer.
    const pooled = Buffer.from('....', 'utf8');
    pooled.writeUInt32LE(99, 0);
    expect(pooled.byteLength).toBe(4);
    expect(attrUint32([attr(ATTR.CASKET_ITEM_COUNT, pooled)], ATTR.CASKET_ITEM_COUNT)).toBe(99);
  });

  it('decodes a length-prefixed UTF-8 string', () => {
    const text = 'zapas – noże ★';
    const body = new TextEncoder().encode(text);
    const bytes = new Uint8Array(2 + body.length);
    new DataView(bytes.buffer).setUint16(0, body.length, true);
    bytes.set(body, 2);

    expect(attrString([attr(ATTR.CUSTOM_NAME, bytes)], ATTR.CUSTOM_NAME)).toBe(text);
  });

  it('decodes a string from an offset view too', () => {
    const body = new TextEncoder().encode('knives');
    const pool = new Uint8Array(64).fill(0xab);
    const start = 9;
    new DataView(pool.buffer, start, 2).setUint16(0, body.length, true);
    pool.set(body, start + 2);

    const bytes = pool.subarray(start, start + 2 + body.length);
    expect(attrString([attr(ATTR.CUSTOM_NAME, bytes)], ATTR.CUSTOM_NAME)).toBe('knives');
  });

  it('returns null for a missing attribute or a missing bag', () => {
    expect(attrBytes(undefined, ATTR.PAINT_INDEX)).toBeNull();
    expect(attrBytes([], ATTR.PAINT_INDEX)).toBeNull();
    expect(attrUint32([attr(1, u32(5))], ATTR.PAINT_INDEX)).toBeNull();
    expect(attrFloat([attr(1, u32(5))], ATTR.PAINT_INDEX)).toBeNull();
    expect(attrString([attr(1, u32(5))], ATTR.CUSTOM_NAME)).toBeNull();
  });

  it('refuses to read past the end of a short value', () => {
    const short = new Uint8Array([1, 2]);
    expect(attrUint32([attr(ATTR.PAINT_INDEX, short)], ATTR.PAINT_INDEX)).toBeNull();
    expect(attrFloat([attr(ATTR.PAINT_INDEX, short)], ATTR.PAINT_INDEX)).toBeNull();
  });

  it('treats an empty string payload as absent', () => {
    // Two bytes of length prefix and nothing after it.
    expect(attrString([attr(ATTR.CUSTOM_NAME, new Uint8Array(2))], ATTR.CUSTOM_NAME)).toBeNull();
  });

  it('handles a null value_bytes without throwing', () => {
    expect(attrBytes([{ def_index: ATTR.PAINT_INDEX, value_bytes: null }], ATTR.PAINT_INDEX)).toBeNull();
    expect(attrBytes([{ def_index: ATTR.PAINT_INDEX }], ATTR.PAINT_INDEX)).toBeNull();
  });
});

describe('readCasketId', () => {
  it('reassembles a 64-bit id past the safe integer range', () => {
    const id = 39457183930000123n;
    const attributes = [
      attr(ATTR.CASKET_ID_LOW, u32(Number(id & 0xffffffffn), 12)),
      attr(ATTR.CASKET_ID_HIGH, u32(Number(id >> 32n), 36)),
    ];
    expect(readCasketId(attributes)).toBe(id.toString());
  });

  it('returns null unless both halves are present', () => {
    expect(readCasketId([attr(ATTR.CASKET_ID_LOW, u32(1))])).toBeNull();
    expect(readCasketId([attr(ATTR.CASKET_ID_HIGH, u32(1))])).toBeNull();
    expect(readCasketId([])).toBeNull();
  });
});
