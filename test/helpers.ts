import { ATTR } from '../src/domain/attributes.js';
import type { RawEconItem } from '../src/domain/econ.js';

export function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value, 0);
  return buffer;
}

export function f32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatLE(value, 0);
  return buffer;
}

/** Mirrors how the GC encodes custom names: two length bytes, then UTF-8. */
export function lengthPrefixed(text: string): Buffer {
  const body = Buffer.from(text, 'utf8');
  const prefix = Buffer.alloc(2);
  prefix.writeUInt16LE(body.length, 0);
  return Buffer.concat([prefix, body]);
}

export function attr(defIndex: number, value: Buffer): { def_index: number; value_bytes: Buffer } {
  return { def_index: defIndex, value_bytes: value };
}

export interface EconFixture {
  id: string;
  defIndex: number;
  quality?: number;
  rarity?: number;
  paintIndex?: number;
  paintSeed?: number;
  wear?: number;
  customName?: string;
  casketId?: string;
  containedCount?: number;
  stickerIds?: number[];
  keychainId?: number;
  highlightId?: number;
  musicId?: number;
  tintId?: number;
}

/** Builds a raw GC item the way the game coordinator actually sends one. */
export function econItem(fixture: EconFixture): RawEconItem {
  const attributes: { def_index: number; value_bytes: Buffer }[] = [];

  if (fixture.paintIndex !== undefined) attributes.push(attr(ATTR.PAINT_INDEX, f32(fixture.paintIndex)));
  if (fixture.paintSeed !== undefined) attributes.push(attr(ATTR.PAINT_SEED, f32(fixture.paintSeed)));
  if (fixture.wear !== undefined) attributes.push(attr(ATTR.PAINT_WEAR, f32(fixture.wear)));
  if (fixture.customName !== undefined) {
    attributes.push(attr(ATTR.CUSTOM_NAME, lengthPrefixed(fixture.customName)));
  }
  if (fixture.casketId !== undefined) {
    const id = BigInt(fixture.casketId);
    attributes.push(attr(ATTR.CASKET_ID_LOW, u32(Number(id & 0xffffffffn))));
    attributes.push(attr(ATTR.CASKET_ID_HIGH, u32(Number(id >> 32n))));
  }
  if (fixture.containedCount !== undefined) {
    attributes.push(attr(ATTR.CASKET_ITEM_COUNT, u32(fixture.containedCount)));
  }
  for (const [slot, stickerId] of (fixture.stickerIds ?? []).entries()) {
    attributes.push(attr(ATTR.STICKER_SLOT_0_ID + slot * 4, u32(stickerId)));
  }
  if (fixture.keychainId !== undefined) {
    attributes.push(attr(ATTR.KEYCHAIN_SLOT_0_ID, u32(fixture.keychainId)));
  }
  if (fixture.highlightId !== undefined) {
    attributes.push(attr(ATTR.KEYCHAIN_SLOT_0_HIGHLIGHT, u32(fixture.highlightId)));
  }
  if (fixture.musicId !== undefined) attributes.push(attr(ATTR.MUSIC_ID, u32(fixture.musicId)));
  if (fixture.tintId !== undefined) attributes.push(attr(ATTR.SPRAY_TINT_ID, u32(fixture.tintId)));

  return {
    id: fixture.id,
    def_index: fixture.defIndex,
    quality: fixture.quality ?? 4,
    rarity: fixture.rarity ?? 0,
    attribute: attributes,
  };
}
