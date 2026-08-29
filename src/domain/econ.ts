import {
  ATTR,
  DEF,
  attrFloat,
  attrString,
  attrUint32,
  readCasketId,
  type RawAttribute,
} from './attributes.js';
import { isSouvenir, isStatTrak } from './names.js';
import type { KeychainRef, NormalizedItem, StickerRef } from './types.js';

/**
 * The shape the CS2 game coordinator sends us, as decoded by `globaloffensive`.
 * Everything is optional because the GC omits attributes that do not apply.
 */
export interface RawEconItem {
  id?: unknown;
  def_index?: number;
  quality?: number;
  rarity?: number;
  origin?: number;
  inventory?: number;
  position?: number;
  attribute?: RawAttribute[];
  /** Fields the library pre-parses for us; used as a fallback. */
  paint_index?: number;
  paint_seed?: number;
  paint_wear?: number;
  custom_name?: string;
  casket_id?: string;
  casket_contained_item_count?: number;
  tradable_after?: Date | string;
}

/** uint64 ids arrive as strings, numbers, or Long objects depending on codec. */
function idToString(id: unknown): string {
  if (id === null || id === undefined) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'bigint') return id.toString();
  return String(id);
}

function readStickers(attributes: RawAttribute[] | undefined): StickerRef[] {
  const stickers: StickerRef[] = [];
  for (let slot = 0; slot <= 5; slot += 1) {
    const base = ATTR.STICKER_SLOT_0_ID + slot * 4;
    const stickerId = attrUint32(attributes, base);
    if (stickerId === null) continue;
    stickers.push({ slot, stickerId, wear: attrFloat(attributes, base + 1) });
  }
  return stickers;
}

function readKeychain(attributes: RawAttribute[] | undefined): KeychainRef | null {
  const keychainId = attrUint32(attributes, ATTR.KEYCHAIN_SLOT_0_ID);
  const highlightId = attrUint32(attributes, ATTR.KEYCHAIN_SLOT_0_HIGHLIGHT);
  if (keychainId === null && highlightId === null) return null;
  return {
    keychainId: keychainId ?? 0,
    seed: attrUint32(attributes, ATTR.KEYCHAIN_SLOT_0_SEED),
    highlightId,
  };
}

function readTradableAfter(item: RawEconItem): string | null {
  const epoch = attrUint32(item.attribute, ATTR.TRADABLE_AFTER);
  if (epoch !== null) return new Date(epoch * 1000).toISOString();
  if (item.tradable_after instanceof Date) return item.tradable_after.toISOString();
  if (typeof item.tradable_after === 'string') return item.tradable_after;
  return null;
}

/**
 * Turns a raw GC econ item into the flat shape the rest of the app uses.
 *
 * Attributes are read straight off the wire rather than trusting the fields
 * `globaloffensive` pre-parses, because it does not decode keychains, music
 * kits or graffiti tints -- all of which we need to name an item.
 */
export function normalizeEconItem(item: RawEconItem): NormalizedItem {
  const attributes = item.attribute;
  const defIndex = item.def_index ?? 0;
  const quality = item.quality ?? 0;

  const rawPaintIndex = attrFloat(attributes, ATTR.PAINT_INDEX) ?? item.paint_index ?? null;
  const rawPaintSeed = attrFloat(attributes, ATTR.PAINT_SEED) ?? item.paint_seed ?? null;
  const floatValue = attrFloat(attributes, ATTR.PAINT_WEAR) ?? item.paint_wear ?? null;

  const isContainer = defIndex === DEF.STORAGE_UNIT;

  return {
    assetId: idToString(item.id),
    defIndex,
    paintIndex: rawPaintIndex === null ? null : Math.round(rawPaintIndex),
    paintSeed: rawPaintSeed === null ? null : Math.floor(rawPaintSeed),
    floatValue,
    quality,
    rarity: item.rarity ?? 0,
    stattrak: isStatTrak(quality),
    souvenir: isSouvenir(quality),
    customName: attrString(attributes, ATTR.CUSTOM_NAME) ?? item.custom_name ?? null,
    containerId: readCasketId(attributes) ?? item.casket_id ?? null,
    isContainer,
    containedCount: isContainer
      ? attrUint32(attributes, ATTR.CASKET_ITEM_COUNT) ?? item.casket_contained_item_count ?? 0
      : null,
    stickers: readStickers(attributes),
    keychain: readKeychain(attributes),
    musicId: attrUint32(attributes, ATTR.MUSIC_ID),
    tintId: attrUint32(attributes, ATTR.SPRAY_TINT_ID),
    tradableAfter: readTradableAfter(item),
    origin: item.origin ?? null,
    position: item.position ?? null,
  };
}
