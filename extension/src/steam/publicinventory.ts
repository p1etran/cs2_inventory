/**
 * The public inventory, which needs no sign-in at all.
 *
 * `steamcommunity.com/inventory/<steamid>/730/2` returns everything the
 * account holds *loose*, plus its storage units as opaque items. What is
 * inside a unit is not there -- that is the whole reason this project talks to
 * the game coordinator. But the unit's label and how many items it holds are,
 * and so is every loose item.
 *
 * That is enough to show somebody their real inventory the moment they install
 * the extension, before asking them to scan anything. The QR sign-in then buys
 * one specific thing: seeing inside the units.
 *
 * Deliberately kept out of the index. These items have no float, no paint
 * seed and no asset-level detail, so mixing them into a synced inventory would
 * quietly degrade it. This is a preview, and it is replaced by the real thing.
 */

const INVENTORY_URL = (steamId: string, count: number) =>
  `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=${count}`;

/** Steam's own cap for this endpoint. */
const PAGE_SIZE = 2000;
/** One page covers a typical loose inventory; more than this is not a preview. */
const MAX_PAGES = 3;

const IMAGE_BASE = 'https://community.cloudflare.steamstatic.com/economy/image/';

export interface PreviewItem {
  marketHashName: string;
  count: number;
  imageUrl: string | null;
  rarityName: string | null;
  rarityColor: string | null;
  category: string | null;
}

export interface PreviewUnit {
  label: string;
  /** What the game says it holds. The contents need a sign-in. */
  containedCount: number;
}

export interface InventoryPreview {
  /** Loose items, grouped by name, most numerous first. */
  items: PreviewItem[];
  units: PreviewUnit[];
  /** Every loose item, counting duplicates. */
  looseCount: number;
  /** Items sitting inside units, which this view cannot see into. */
  storedCount: number;
}

export class PublicInventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicInventoryError';
  }
}

interface Asset {
  assetid?: string;
  classid?: string;
  instanceid?: string;
  amount?: string;
}

interface Tag {
  category?: string;
  localized_tag_name?: string;
  internal_name?: string;
}

interface Description {
  classid?: string;
  instanceid?: string;
  market_hash_name?: string;
  name?: string;
  icon_url?: string;
  name_color?: string;
  tags?: Tag[];
  descriptions?: { value?: string }[];
  fraudwarnings?: string[];
}

interface InventoryResponse {
  success?: number;
  assets?: Asset[];
  descriptions?: Description[];
  more_items?: number;
  last_assetid?: string;
  error?: string;
}

/** Storage units are identified by name; there is no def_index in this API. */
const STORAGE_UNIT = 'Storage Unit';

/** The unit's item count, which Steam puts in a description line as prose. */
function containedCount(description: Description): number {
  for (const line of description.descriptions ?? []) {
    const match = /Number of Items:\s*(\d+)/i.exec(line.value ?? '');
    if (match?.[1]) return Number(match[1]);
  }
  return 0;
}

/**
 * A unit's label, which arrives as a name tag inside a fraud warning.
 *
 * Steam wraps it in doubled single quotes -- `Name Tag: ''cases - p1''` -- and
 * a label can itself contain quotes, so the closing pair is matched at the end
 * rather than lazily.
 */
function nameTag(description: Description): string | null {
  for (const warning of description.fraudwarnings ?? []) {
    const match = /^Name Tag:\s*''(.*)''\s*$/s.exec(warning);
    if (match?.[1]) return match[1];
  }
  return null;
}

function tagValue(description: Description, category: string): string | null {
  const tag = description.tags?.find((candidate) => candidate.category === category);
  return tag?.localized_tag_name ?? null;
}

/** Parses one page. Pure, so the shape can be tested without the network. */
export function parseInventoryPage(body: unknown): {
  assets: Asset[];
  descriptions: Map<string, Description>;
  more: boolean;
  lastAssetId: string | null;
} {
  const reply = (body ?? {}) as InventoryResponse;

  if (reply.success !== 1) {
    throw new PublicInventoryError(
      reply.error || 'Steam did not return an inventory. It may be private, or Steam may be busy.',
    );
  }

  const descriptions = new Map<string, Description>();
  for (const description of reply.descriptions ?? []) {
    descriptions.set(`${description.classid}_${description.instanceid}`, description);
  }

  return {
    assets: reply.assets ?? [],
    descriptions,
    more: reply.more_items === 1,
    lastAssetId: reply.last_assetid ?? null,
  };
}

/** Folds assets and their descriptions into something renderable. */
export function summarize(
  pages: { assets: Asset[]; descriptions: Map<string, Description> }[],
): InventoryPreview {
  const grouped = new Map<string, PreviewItem>();
  const units: PreviewUnit[] = [];
  let looseCount = 0;
  let storedCount = 0;

  for (const page of pages) {
    for (const asset of page.assets) {
      const description = page.descriptions.get(`${asset.classid}_${asset.instanceid}`);
      if (!description) continue;

      const name = description.market_hash_name || description.name || 'Unknown item';
      const amount = Number(asset.amount ?? '1') || 1;

      if (name === STORAGE_UNIT) {
        const held = containedCount(description);
        units.push({ label: nameTag(description) || STORAGE_UNIT, containedCount: held });
        storedCount += held;
        // A unit is itself an item in the inventory.
        looseCount += amount;
        continue;
      }

      looseCount += amount;
      const existing = grouped.get(name);
      if (existing) {
        existing.count += amount;
        continue;
      }
      grouped.set(name, {
        marketHashName: name,
        count: amount,
        imageUrl: description.icon_url ? `${IMAGE_BASE}${description.icon_url}` : null,
        rarityName: tagValue(description, 'Rarity'),
        rarityColor: description.name_color ? `#${description.name_color}` : null,
        category: tagValue(description, 'Type'),
      });
    }
  }

  return {
    items: [...grouped.values()].sort(
      (a, b) => b.count - a.count || a.marketHashName.localeCompare(b.marketHashName),
    ),
    units: units.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    looseCount,
    storedCount,
  };
}

export type Fetcher = (url: string) => Promise<unknown>;

const defaultFetcher: Fetcher = async (url) => {
  // `include` so the browser sends the steamcommunity.com session it holds,
  // which is what makes a private inventory visible to its own owner.
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 429) {
    throw new PublicInventoryError(
      'Steam is rate-limiting inventory requests from this address. Try again in a few minutes.',
    );
  }
  if (!response.ok) {
    throw new PublicInventoryError(`Steam returned HTTP ${response.status} for the inventory`);
  }
  return response.json();
};

export async function readPublicInventory(
  steamId: string,
  fetcher: Fetcher = defaultFetcher,
): Promise<InventoryPreview> {
  const pages = [];
  let url = INVENTORY_URL(steamId, PAGE_SIZE);

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const parsed = parseInventoryPage(await fetcher(url));
    pages.push(parsed);
    if (!parsed.more || !parsed.lastAssetId) break;
    url = `${INVENTORY_URL(steamId, PAGE_SIZE)}&start_assetid=${parsed.lastAssetId}`;
  }

  return summarize(pages);
}
