import { DEF, RARITY_COLORS, RARITY_NAMES } from '../domain/attributes.js';
import { buildMarketHashName, wearName } from '../domain/names.js';
import type { NormalizedItem, ResolvedItem } from '../domain/types.js';
import { GRAFFITI_TINTS } from './tints.js';
import { emptyCatalogIndex, type CatalogEntry, type CatalogIndex } from './types.js';

const STORAGE_UNIT_NAME = 'Storage Unit';
const MUSIC_KIT_PREFIX = 'Music Kit | ';

interface Match {
  entry: CatalogEntry;
  /** Extra suffix that is part of the market name, e.g. a graffiti tint. */
  suffix?: string;
  /** Set when the family never carries an exterior, e.g. stickers. */
  hasWear?: boolean;
}

/**
 * Resolves game-coordinator items to human names using the compacted schema.
 *
 * Every branch is keyed off the item's definition index, because the id in an
 * attribute means something different per family: "sticker slot 0 id" holds a
 * sticker kit for a sticker, a graffiti kit for a graffiti, and a patch kit
 * for a patch.
 */
export class Catalog {
  constructor(private readonly index: CatalogIndex = emptyCatalogIndex()) {}

  get builtAt(): string {
    return this.index.builtAt;
  }

  get skinCount(): number {
    return Object.keys(this.index.skins).length;
  }

  get isEmpty(): boolean {
    return this.skinCount === 0 && Object.keys(this.index.byDef).length === 0;
  }

  private firstStickerId(item: NormalizedItem): number | null {
    const slotZero = item.stickers.find((s) => s.slot === 0) ?? item.stickers[0];
    return slotZero ? slotZero.stickerId : null;
  }

  private lookupByStickerKit(
    table: Record<string, CatalogEntry>,
    item: NormalizedItem,
  ): CatalogEntry | undefined {
    const id = this.firstStickerId(item);
    return id === null ? undefined : table[String(id)];
  }

  private match(item: NormalizedItem): Match | null {
    switch (item.defIndex) {
      case DEF.STORAGE_UNIT:
        return { entry: { name: STORAGE_UNIT_NAME, category: 'Tool' } };

      case DEF.STICKER: {
        const entry = this.lookupByStickerKit(this.index.stickers, item);
        return entry ? { entry } : null;
      }

      case DEF.PATCH: {
        const entry = this.lookupByStickerKit(this.index.patches, item);
        return entry ? { entry } : null;
      }

      case DEF.GRAFFITI_SEALED:
      case DEF.GRAFFITI_APPLIED: {
        const entry = this.lookupByStickerKit(this.index.graffiti, item);
        if (!entry) return null;
        const tint = item.tintId === null ? undefined : GRAFFITI_TINTS[item.tintId];
        return { entry, suffix: tint };
      }

      case DEF.KEYCHAIN: {
        // Souvenir charms carry a highlight reel id in a separate attribute
        // from ordinary charms, and the two id spaces overlap.
        const highlightId = item.keychain?.highlightId ?? null;
        if (highlightId !== null) {
          const entry = this.index.highlights[String(highlightId)];
          if (entry) return { entry };
        }
        const keychainId = item.keychain?.keychainId ?? null;
        if (keychainId !== null) {
          const entry = this.index.keychains[String(keychainId)];
          if (entry) return { entry };
        }
        return null;
      }

      case DEF.MUSIC_KIT: {
        if (item.musicId === null) return null;
        const entry = this.index.musicKits[String(item.musicId)];
        if (!entry) return null;
        const name = entry.name.startsWith(MUSIC_KIT_PREFIX)
          ? entry.name
          : `${MUSIC_KIT_PREFIX}${entry.name}`;
        return { entry: { ...entry, name } };
      }

      default:
        break;
    }

    if (item.paintIndex !== null && item.paintIndex > 0) {
      const entry = this.index.skins[`${item.defIndex}:${item.paintIndex}`];
      if (entry) return { entry, hasWear: true };
    }

    const byDef = this.index.byDef[String(item.defIndex)];
    if (byDef) return { entry: byDef };

    // Unpainted weapons, including vanilla knives.
    const weapon = this.index.weapons[String(item.defIndex)];
    if (weapon) {
      return { entry: { name: weapon.star ? `★ ${weapon.name}` : weapon.name } };
    }

    return null;
  }

  resolve(item: NormalizedItem): ResolvedItem {
    const match = this.match(item);

    if (!match) {
      const parts = [`Unknown item ${item.defIndex}`];
      if (item.paintIndex) parts.push(`paint ${item.paintIndex}`);
      const placeholder = parts.join(' / ');
      return {
        ...item,
        marketHashName: placeholder,
        baseName: placeholder,
        wearName: wearName(item.floatValue),
        rarityName: RARITY_NAMES[item.rarity] ?? null,
        rarityColor: RARITY_COLORS[item.rarity] ?? null,
        category: null,
        imageUrl: null,
        resolved: false,
      };
    }

    const baseName = match.suffix ? `${match.entry.name} (${match.suffix})` : match.entry.name;
    // Only painted items carry an exterior; a float on anything else is noise.
    const exterior = match.hasWear ? wearName(item.floatValue) : null;

    return {
      ...item,
      marketHashName: buildMarketHashName({
        baseName,
        stattrak: item.stattrak,
        souvenir: item.souvenir,
        wear: exterior,
      }),
      baseName,
      wearName: exterior,
      rarityName: match.entry.rarity ?? RARITY_NAMES[item.rarity] ?? null,
      rarityColor: match.entry.rarityColor ?? RARITY_COLORS[item.rarity] ?? null,
      category: match.entry.category ?? null,
      imageUrl: match.entry.image ?? null,
      resolved: true,
    };
  }
}
