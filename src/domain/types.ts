export interface StickerRef {
  slot: number;
  stickerId: number;
  wear: number | null;
}

export interface KeychainRef {
  keychainId: number;
  seed: number | null;
  highlightId: number | null;
}

/** A game-coordinator econ item, reduced to the fields this app cares about. */
export interface NormalizedItem {
  assetId: string;
  defIndex: number;
  paintIndex: number | null;
  paintSeed: number | null;
  floatValue: number | null;
  quality: number;
  rarity: number;
  stattrak: boolean;
  souvenir: boolean;
  /** Name tag text, or the label on a storage unit. */
  customName: string | null;
  /** Asset id of the storage unit holding this item; null when loose. */
  containerId: string | null;
  isContainer: boolean;
  containedCount: number | null;
  stickers: StickerRef[];
  keychain: KeychainRef | null;
  musicId: number | null;
  tintId: number | null;
  tradableAfter: string | null;
  origin: number | null;
  position: number | null;
}

/** A normalized item plus everything the catalog could tell us about it. */
export interface ResolvedItem extends NormalizedItem {
  marketHashName: string;
  baseName: string;
  wearName: string | null;
  rarityName: string | null;
  rarityColor: string | null;
  category: string | null;
  imageUrl: string | null;
  /** False when we could not identify the item and fell back to a placeholder. */
  resolved: boolean;
}
