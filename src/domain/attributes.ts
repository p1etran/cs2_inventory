/**
 * Econ attribute definition indices, taken from the `attributes` block of
 * items_game.txt. The game coordinator hands us items as a bag of
 * (def_index, value_bytes) pairs, so these are the only way to read anything
 * beyond the base item definition.
 */
export const ATTR = {
  PAINT_INDEX: 6,
  PAINT_SEED: 7,
  PAINT_WEAR: 8,
  TRADABLE_AFTER: 75,
  CUSTOM_NAME: 111,
  /** Slots 0-5 are laid out at 113 + slot * 4. */
  STICKER_SLOT_0_ID: 113,
  MUSIC_ID: 166,
  SPRAYS_REMAINING: 232,
  SPRAY_TINT_ID: 233,
  CASKET_ITEM_COUNT: 270,
  CASKET_ID_LOW: 272,
  CASKET_ID_HIGH: 273,
  KEYCHAIN_SLOT_0_ID: 299,
  KEYCHAIN_SLOT_0_SEED: 306,
  KEYCHAIN_SLOT_0_HIGHLIGHT: 314,
} as const;

/** Item definition indices whose contents need special naming rules. */
export const DEF = {
  STORAGE_UNIT: 1201,
  STICKER: 1209,
  MUSIC_KIT: 1314,
  GRAFFITI_SEALED: 1348,
  GRAFFITI_APPLIED: 1349,
  KEYCHAIN: 1355,
  PATCH: 4609,
} as const;

/** Econ item qualities (the `qualities` block of items_game.txt). */
export const QUALITY = {
  NORMAL: 0,
  GENUINE: 1,
  VINTAGE: 2,
  UNUSUAL: 3,
  UNIQUE: 4,
  COMMUNITY: 5,
  DEVELOPER: 6,
  SELFMADE: 7,
  CUSTOMIZED: 8,
  /** "Strange" in the schema; shown as StatTrak(TM) in game. */
  STRANGE: 9,
  COMPLETED: 10,
  HAUNTED: 11,
  /** "Tournament" in the schema; shown as Souvenir in game. */
  TOURNAMENT: 12,
  HIGHLIGHT: 13,
  VOLATILE: 14,
} as const;

/** Fallback rarity names, used when the catalog has nothing better. */
export const RARITY_NAMES: Record<number, string> = {
  0: 'Stock',
  1: 'Consumer Grade',
  2: 'Industrial Grade',
  3: 'Mil-Spec',
  4: 'Restricted',
  5: 'Classified',
  6: 'Covert',
  7: 'Contraband',
};

export const RARITY_COLORS: Record<number, string> = {
  0: '#b0c3d9',
  1: '#b0c3d9',
  2: '#5e98d9',
  3: '#4b69ff',
  4: '#8847ff',
  5: '#d32ce6',
  6: '#eb4b4b',
  7: '#e4ae39',
};

export interface RawAttribute {
  def_index?: number;
  value_bytes?: Buffer | Uint8Array | null;
}

function toBuffer(value: Buffer | Uint8Array | null | undefined): Buffer | null {
  if (!value) return null;
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

/** Returns the raw bytes of an attribute, or null when the item lacks it. */
export function attrBytes(attributes: RawAttribute[] | undefined, defIndex: number): Buffer | null {
  if (!attributes) return null;
  const found = attributes.find((a) => a.def_index === defIndex);
  return found ? toBuffer(found.value_bytes) : null;
}

export function attrUint32(attributes: RawAttribute[] | undefined, defIndex: number): number | null {
  const bytes = attrBytes(attributes, defIndex);
  return bytes && bytes.length >= 4 ? bytes.readUInt32LE(0) : null;
}

export function attrFloat(attributes: RawAttribute[] | undefined, defIndex: number): number | null {
  const bytes = attrBytes(attributes, defIndex);
  return bytes && bytes.length >= 4 ? bytes.readFloatLE(0) : null;
}

/**
 * Custom names (name tags, and the labels people give storage units) are
 * stored with a two-byte length prefix ahead of the UTF-8 payload.
 */
export function attrString(attributes: RawAttribute[] | undefined, defIndex: number): string | null {
  const bytes = attrBytes(attributes, defIndex);
  if (!bytes || bytes.length <= 2) return null;
  return bytes.subarray(2).toString('utf8');
}

/**
 * The casket an item lives in is a 64-bit id split across two attributes.
 * Assembled with BigInt so ids past 2^53 survive the trip.
 */
export function readCasketId(attributes: RawAttribute[] | undefined): string | null {
  const low = attrUint32(attributes, ATTR.CASKET_ID_LOW);
  const high = attrUint32(attributes, ATTR.CASKET_ID_HIGH);
  if (low === null || high === null) return null;
  return ((BigInt(high) << 32n) | BigInt(low)).toString();
}
