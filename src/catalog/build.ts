import { GRAFFITI_TINTS } from './tints.js';
import { CATALOG_VERSION, emptyCatalogIndex, type CatalogEntry, type CatalogIndex } from './types.js';

/**
 * The item schema is published as JSON by ByMykel/CSGO-API, which generates it
 * from the game's own items_game.txt and the English localisation file.
 */
const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

/** Families whose JSON `def_index` is the item's own definition index. */
const BY_DEF_FILES = ['crates', 'collectibles', 'agents', 'tools'] as const;

/** Families keyed by an id that appears in an attribute rather than def_index. */
const KEYED_FILES = {
  stickers: 'stickers',
  graffiti: 'graffiti',
  patches: 'patches',
  keychains: 'keychains',
  highlights: 'highlights',
  musicKits: 'music_kits',
} as const;

const TINT_NAMES = new Set(Object.values(GRAFFITI_TINTS));
const STATTRAK_PREFIX = 'StatTrak\u2122 ';

/**
 * Sealed graffiti ship as one row per tint, each with the tint baked into the
 * name, and all of them share a kit id. We store the untinted base and let the
 * resolver append the tint the item actually carries.
 */
function stripGraffitiTint(entry: CatalogEntry): CatalogEntry {
  const match = /^(.*) \(([^()]+)\)$/.exec(entry.name);
  if (!match || !TINT_NAMES.has(match[2] as string)) return entry;
  return { ...entry, name: match[1] as string };
}

/**
 * Music kits are listed twice per id, once plain and once StatTrak. Store the
 * plain title either way; the quality on the item decides the final name.
 */
function stripStatTrakPrefix(entry: CatalogEntry): CatalogEntry {
  return entry.name.startsWith(STATTRAK_PREFIX)
    ? { ...entry, name: entry.name.slice(STATTRAK_PREFIX.length) }
    : entry;
}

const TRANSFORMS: Partial<Record<keyof typeof KEYED_FILES, (entry: CatalogEntry) => CatalogEntry | null>> = {
  graffiti: stripGraffitiTint,
  musicKits: stripStatTrakPrefix,
};

interface SourceRarity {
  name?: string | null;
  color?: string | null;
}

interface SourceItem {
  name?: string | null;
  market_hash_name?: string | null;
  def_index?: string | number | null;
  paint_index?: string | number | null;
  image?: string | null;
  rarity?: SourceRarity | null;
  category?: { name?: string | null } | null;
  weapon?: { weapon_id?: number | null; name?: string | null } | null;
}

export type Fetcher = (url: string) => Promise<unknown>;

const defaultFetcher: Fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  return response.json();
};

function toEntry(item: SourceItem): CatalogEntry | null {
  const name = item.market_hash_name ?? item.name;
  if (!name) return null;
  const entry: CatalogEntry = { name };
  if (item.rarity?.name) entry.rarity = item.rarity.name;
  if (item.rarity?.color) entry.rarityColor = item.rarity.color;
  if (item.image) entry.image = item.image;
  if (item.category?.name) entry.category = item.category.name;
  return entry;
}

function asArray(value: unknown, label: string): SourceItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`Catalog source ${label} was not a JSON array`);
  }
  return value as SourceItem[];
}

/**
 * Indexes a family by its id. First row wins: a handful of ids are reused
 * upstream (souvenir packages and their highlight variants share one), and the
 * first listing is the ordinary item.
 */
function indexByDefIndex(
  target: Record<string, CatalogEntry>,
  items: SourceItem[],
  transform?: (entry: CatalogEntry) => CatalogEntry | null,
): void {
  for (const item of items) {
    if (item.def_index === null || item.def_index === undefined) continue;
    const key = String(item.def_index);
    if (key in target) continue;

    const base = toEntry(item);
    if (!base) continue;
    const entry = transform ? transform(base) : base;
    if (entry) target[key] = entry;
  }
}

/**
 * Skins are grouped one row per finish, with the wear tiers listed separately.
 * We key them by weapon def index and paint index, which is exactly the pair
 * the game coordinator gives us.
 */
function indexSkins(index: CatalogIndex, items: SourceItem[]): void {
  for (const item of items) {
    const weaponId = item.weapon?.weapon_id;
    if (weaponId === null || weaponId === undefined) continue;
    const entry = toEntry(item);
    if (!entry) continue;

    if (item.paint_index !== null && item.paint_index !== undefined) {
      index.skins[`${weaponId}:${Number(item.paint_index)}`] = entry;
    }

    // Remember the plain weapon name so vanilla knives can still be named.
    const weaponName = item.weapon?.name;
    if (weaponName && !index.weapons[String(weaponId)]) {
      index.weapons[String(weaponId)] = {
        name: weaponName,
        star: entry.name.startsWith('★'),
      };
    }
  }
}

export interface BuildOptions {
  baseUrl?: string;
  fetcher?: Fetcher;
  onProgress?: (message: string) => void;
}

/**
 * Downloads the item schema and compacts it into the lookup tables we need.
 * The raw sources total roughly 40 MB; the result is a small fraction of that
 * because everything except names, rarities and images is dropped.
 */
export async function buildCatalogIndex(options: BuildOptions = {}): Promise<CatalogIndex> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetcher = options.fetcher ?? defaultFetcher;
  const report = options.onProgress ?? (() => {});
  const index = emptyCatalogIndex();

  report('downloading skins');
  indexSkins(index, asArray(await fetcher(`${baseUrl}/skins.json`), 'skins'));

  for (const file of BY_DEF_FILES) {
    report(`downloading ${file}`);
    indexByDefIndex(index.byDef, asArray(await fetcher(`${baseUrl}/${file}.json`), file));
  }

  for (const [key, file] of Object.entries(KEYED_FILES)) {
    report(`downloading ${file}`);
    const family = key as keyof typeof KEYED_FILES;
    const target = index[family] as Record<string, CatalogEntry>;
    indexByDefIndex(target, asArray(await fetcher(`${baseUrl}/${file}.json`), file), TRANSFORMS[family]);
  }

  index.version = CATALOG_VERSION;
  index.builtAt = new Date().toISOString();
  return index;
}
