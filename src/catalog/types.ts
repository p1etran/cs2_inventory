export interface CatalogEntry {
  name: string;
  rarity?: string;
  rarityColor?: string;
  image?: string;
  category?: string;
}

export interface WeaponEntry {
  name: string;
  /** Knives and gloves render with a leading star in their market name. */
  star: boolean;
}

/**
 * Lookup tables keyed by whichever id the game coordinator actually gives us
 * for that family of items. They are deliberately separate namespaces: a
 * sticker kit id of 1 and a keychain id of 1 are unrelated items.
 */
export interface CatalogIndex {
  version: number;
  builtAt: string;
  /** Keyed `${defIndex}:${paintIndex}` -- painted weapons, knives and gloves. */
  skins: Record<string, CatalogEntry>;
  /** Keyed by weapon def index, for vanilla (unpainted) knives and guns. */
  weapons: Record<string, WeaponEntry>;
  /** Keyed by the item's own def index -- cases, agents, pins, tools. */
  byDef: Record<string, CatalogEntry>;
  /** Keyed by sticker kit id, read from "sticker slot 0 id". */
  stickers: Record<string, CatalogEntry>;
  graffiti: Record<string, CatalogEntry>;
  patches: Record<string, CatalogEntry>;
  /** Keyed by keychain id, read from "keychain slot 0 id". */
  keychains: Record<string, CatalogEntry>;
  /** Keyed by highlight reel id, read from "keychain slot 0 highlight". */
  highlights: Record<string, CatalogEntry>;
  /** Keyed by music id. */
  musicKits: Record<string, CatalogEntry>;
}

export function emptyCatalogIndex(): CatalogIndex {
  return {
    version: CATALOG_VERSION,
    builtAt: new Date(0).toISOString(),
    skins: {},
    weapons: {},
    byDef: {},
    stickers: {},
    graffiti: {},
    patches: {},
    keychains: {},
    highlights: {},
    musicKits: {},
  };
}

/** Bump when the compacted shape changes so stale caches get rebuilt. */
export const CATALOG_VERSION = 1;
