import type { PriceTable } from './prices.js';
import {
  searchKey,
  type InventoryDiff,
  type Placement,
  type ResolvedItem,
} from '../../src/core.js';

/**
 * The index, kept as a plain array in memory and persisted as JSON.
 *
 * Deliberately not SQLite. The dataset is tens of thousands of items, not
 * millions, so a linear scan is microseconds and the alternative costs a WASM
 * build, a virtual filesystem and the 460 lines of SQL that `src/db/repo.ts`
 * needs on the server. The query surface below mirrors that file's so the two
 * behave the same, and the pieces where behaviour must match exactly --
 * `searchKey` for search, `diffPlacements` for the change log -- are imported
 * from the shared core rather than reimplemented.
 */

const KEY = 'inventory';
/** Bumped when the stored shape changes, so an old index is rebuilt not misread. */
const VERSION = 1;

export interface StoredItem extends ResolvedItem {
  /** Lowercased name, name tag and unit label, for substring search. */
  searchText: string;
  firstSeen: string;
  lastSeen: string;
  /** Set when a sync looked where this item was and did not find it. */
  removedAt: string | null;
}

export interface EventRow {
  at: string;
  kind: 'added' | 'removed' | 'moved';
  assetId: string;
  marketHashName: string;
  fromContainer: string | null;
  toContainer: string | null;
}

export interface SyncRun {
  at: string;
  steamId: string;
  totalItems: number;
  containers: number;
  added: number;
  removed: number;
  moved: number;
  unresolved: number;
  /** Units the game reports as non-empty that this run could not read. */
  failedContainers: number;
  /**
   * What it was worth, in minor units, when prices were loaded at the time.
   * Absent on a run made without them, which is why it is optional rather
   * than zero -- a zero would draw a portfolio line through the floor.
   */
  value?: number;
  currency?: string;
}

interface Snapshot {
  version: number;
  items: StoredItem[];
  events: EventRow[];
  runs: SyncRun[];
}

/** Events beyond this are dropped oldest-first; the index is the record, not the log. */
const MAX_EVENTS = 2_000;
const MAX_RUNS = 50;

const empty = (): Snapshot => ({ version: VERSION, items: [], events: [], runs: [] });

export interface SearchOptions {
  query?: string;
  containerId?: string | null;
  location?: 'all' | 'loose' | 'stored';
  category?: string;
  rarity?: string;
  stattrak?: boolean;
  souvenir?: boolean;
  unresolvedOnly?: boolean;
  includeRemoved?: boolean;
  sort?: 'name' | 'float' | 'recent' | 'value';
  limit?: number;
  offset?: number;
  /** Needed only for `sort: 'value'`; filtering never depends on price. */
  prices?: PriceTable;
}

export interface ContainerRow {
  assetId: string;
  label: string;
  /** What the game says the unit holds. */
  containedCount: number;
  /** What we actually hold for it. A gap means a read was interrupted. */
  storedCount: number;
  /** Minor units, or null when there are no prices loaded. */
  value: number | null;
}

export interface Stats {
  totalItems: number;
  looseItems: number;
  storedItems: number;
  /** How many different things are owned, as opposed to how many items. */
  distinctNames: number;
  containers: number;
  unresolved: number;
  stattrak: number;
  souvenir: number;
  lastSync: string | null;
}

export interface StackRow {
  marketHashName: string;
  count: number;
  /** How many places these are spread across, which is the useful part. */
  locations: number;
  category: string | null;
  rarityName: string | null;
  rarityColor: string | null;
  imageUrl: string | null;
}

export class Store {
  private snapshot: Snapshot = empty();

  /** Reads the index off disk, starting fresh if it is absent or a stale shape. */
  async load(): Promise<void> {
    const stored = await chrome.storage.local.get(KEY);
    const saved = stored[KEY] as Snapshot | undefined;
    // A version bump means the shape changed; rebuilding from a sync is
    // cheap and correct, where reading the old shape would be neither.
    this.snapshot = saved?.version === VERSION ? saved : empty();
  }

  async save(): Promise<void> {
    try {
      await chrome.storage.local.set({ [KEY]: this.snapshot });
    } catch (error) {
      /*
       * A real account runs to tens of thousands of items: at roughly 840
       * bytes each, sixteen thousand is about 12.8 MB against the 10 MB
       * `chrome.storage.local` allows by default. The manifest asks for
       * `unlimitedStorage`, which lifts that -- but if a write still fails,
       * saying so beats a sync that did all the work and then died in a way
       * nobody could read.
       */
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not save the index (${this.snapshot.items.length} items): ${message}`,
      );
    }
  }

  async clear(): Promise<void> {
    this.snapshot = empty();
    await chrome.storage.local.remove(KEY);
  }

  get items(): readonly StoredItem[] {
    return this.snapshot.items;
  }

  get runs(): readonly SyncRun[] {
    return this.snapshot.runs;
  }

  /** Where every item we still believe in currently sits. */
  livePlacements(): Map<string, Placement> {
    return new Map(
      this.snapshot.items
        .filter((item) => item.removedAt === null)
        .map((item) => [
          item.assetId,
          { containerId: item.containerId, marketHashName: item.marketHashName },
        ]),
    );
  }

  /**
   * Folds a sync's results in.
   *
   * Items are merged rather than replaced so `firstSeen` survives, which is
   * what makes "recent" sorting and the change log mean anything.
   */
  applySync(resolved: ResolvedItem[], diff: InventoryDiff, seenAt: string): void {
    const byId = new Map(this.snapshot.items.map((item) => [item.assetId, item]));

    for (const item of resolved) {
      const existing = byId.get(item.assetId);
      byId.set(item.assetId, {
        ...item,
        searchText: searchKey(item.marketHashName, item.customName),
        firstSeen: existing?.firstSeen ?? seenAt,
        lastSeen: seenAt,
        removedAt: null,
      });
    }

    for (const change of diff.removed) {
      const existing = byId.get(change.assetId);
      if (existing && existing.removedAt === null) {
        byId.set(change.assetId, { ...existing, removedAt: seenAt });
      }
    }

    this.snapshot.items = [...byId.values()];
    this.recordEvents(diff, seenAt);
  }

  private recordEvents(diff: InventoryDiff, at: string): void {
    const events: EventRow[] = [
      ...diff.added.map((change) => ({
        at,
        kind: 'added' as const,
        assetId: change.assetId,
        marketHashName: change.marketHashName,
        fromContainer: null,
        toContainer: change.toContainer,
      })),
      ...diff.moved.map((change) => ({
        at,
        kind: 'moved' as const,
        assetId: change.assetId,
        marketHashName: change.marketHashName,
        fromContainer: change.fromContainer,
        toContainer: change.toContainer,
      })),
      ...diff.removed.map((change) => ({
        at,
        kind: 'removed' as const,
        assetId: change.assetId,
        marketHashName: change.marketHashName,
        fromContainer: change.fromContainer,
        toContainer: null,
      })),
    ];

    this.snapshot.events = [...events, ...this.snapshot.events].slice(0, MAX_EVENTS);
  }

  /** Attaches a value to the most recent run, once prices are known. */
  noteRunValue(value: number, currency: string): void {
    const latest = this.snapshot.runs[0];
    if (latest) this.snapshot.runs[0] = { ...latest, value, currency };
  }

  recordRun(run: SyncRun): void {
    this.snapshot.runs = [run, ...this.snapshot.runs].slice(0, MAX_RUNS);
  }

  recentEvents(limit = 200): EventRow[] {
    return this.snapshot.events.slice(0, limit);
  }

  /**
   * Items matching a filter.
   *
   * Every whitespace-separated word must appear somewhere in the item's
   * searchable text, in any order, so "kara fade" finds a Karambit | Fade.
   * That rule is `src/db/repo.ts`'s, and `searchKey` is shared so the two
   * cannot drift.
   */
  search(options: SearchOptions = {}): { total: number; items: StoredItem[] } {
    const matched = this.filter(options);
    const sorted = this.sort(matched, options.sort ?? 'name', options.prices);
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);

    return { total: sorted.length, items: sorted.slice(offset, offset + limit) };
  }

  private filter(options: SearchOptions): StoredItem[] {
    const words = options.query ? searchKey(options.query).split(' ').filter(Boolean) : [];

    return this.snapshot.items.filter((item) => {
      if (!options.includeRemoved && item.removedAt !== null) return false;
      if (words.some((word) => !item.searchText.includes(word))) return false;

      if (options.containerId !== undefined && options.containerId !== null) {
        if (item.containerId !== options.containerId) return false;
      }
      if (options.location === 'loose' && item.containerId !== null) return false;
      if (options.location === 'stored' && item.containerId === null) return false;

      if (options.category && item.category !== options.category) return false;
      if (options.rarity && item.rarityName !== options.rarity) return false;
      if (options.stattrak && !item.stattrak) return false;
      if (options.souvenir && !item.souvenir) return false;
      if (options.unresolvedOnly && item.resolved) return false;

      return true;
    });
  }

  private sort(
    items: StoredItem[],
    sort: NonNullable<SearchOptions['sort']>,
    prices?: PriceTable,
  ): StoredItem[] {
    const byName = (a: StoredItem, b: StoredItem) =>
      a.marketHashName.localeCompare(b.marketHashName) ||
      (a.floatValue ?? Infinity) - (b.floatValue ?? Infinity);

    const sorted = [...items];
    if (sort === 'float') {
      // Items with no float sort last rather than first, matching the SQL.
      return sorted.sort(
        (a, b) => (a.floatValue ?? Infinity) - (b.floatValue ?? Infinity) || byName(a, b),
      );
    }
    if (sort === 'recent') {
      return sorted.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen) || byName(a, b));
    }
    if (sort === 'value') {
      // Most valuable first: the useful direction for a list you are scanning
      // to find what is worth something. Unpriced items sort last rather than
      // as zero-value, so they do not bury the cheap-but-known ones.
      const priceOf = (item: StoredItem) => prices?.[item.marketHashName] ?? -1;
      return sorted.sort((a, b) => priceOf(b) - priceOf(a) || byName(a, b));
    }
    return sorted.sort(byName);
  }

  /**
   * Storage units, with both counts.
   *
   * `containedCount` is what the game reports and `storedCount` is what we
   * hold; a gap means that unit's read was interrupted, and the UI should say
   * so rather than quietly showing a short list as if it were complete.
   */
  listContainers(prices?: PriceTable): ContainerRow[] {
    const stored = new Map<string, number>();
    const value = new Map<string, number>();
    for (const item of this.snapshot.items) {
      if (item.removedAt !== null || item.containerId === null) continue;
      stored.set(item.containerId, (stored.get(item.containerId) ?? 0) + 1);
      const price = prices?.[item.marketHashName];
      if (price !== undefined) {
        value.set(item.containerId, (value.get(item.containerId) ?? 0) + price);
      }
    }

    return this.snapshot.items
      .filter((item) => item.isContainer && item.removedAt === null)
      .map((unit) => ({
        assetId: unit.assetId,
        label: unit.customName || 'Storage Unit',
        containedCount: unit.containedCount ?? 0,
        storedCount: stored.get(unit.assetId) ?? 0,
        value: prices ? (value.get(unit.assetId) ?? 0) : null,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }

  getStats(): Stats {
    const live = this.snapshot.items.filter((item) => item.removedAt === null);
    return {
      totalItems: live.length,
      looseItems: live.filter((item) => item.containerId === null).length,
      storedItems: live.filter((item) => item.containerId !== null).length,
      distinctNames: new Set(live.map((item) => item.marketHashName)).size,
      containers: live.filter((item) => item.isContainer).length,
      unresolved: live.filter((item) => !item.resolved).length,
      stattrak: live.filter((item) => item.stattrak).length,
      souvenir: live.filter((item) => item.souvenir).length,
      lastSync: this.snapshot.runs[0]?.at ?? null,
    };
  }

  /** The same items grouped by name, which is how a big inventory is read. */
  listStacks(options: SearchOptions = {}): { total: number; rows: StackRow[] } {
    const stacks = new Map<string, StackRow>();
    const places = new Map<string, Set<string>>();

    for (const item of this.filter(options)) {
      const where = places.get(item.marketHashName) ?? new Set<string>();
      where.add(item.containerId ?? 'loose');
      places.set(item.marketHashName, where);

      const existing = stacks.get(item.marketHashName);
      if (existing) {
        existing.count += 1;
        continue;
      }
      stacks.set(item.marketHashName, {
        marketHashName: item.marketHashName,
        count: 1,
        locations: 0,
        category: item.category,
        rarityName: item.rarityName,
        rarityColor: item.rarityColor,
        imageUrl: item.imageUrl,
      });
    }

    for (const [name, stack] of stacks) stack.locations = places.get(name)?.size ?? 0;

    const rows = [...stacks.values()].sort(
      (a, b) => b.count - a.count || a.marketHashName.localeCompare(b.marketHashName),
    );
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);

    return { total: rows.length, rows: rows.slice(offset, offset + limit) };
  }

  listFacets(): { categories: string[]; rarities: string[] } {
    const categories = new Set<string>();
    const rarities = new Set<string>();
    for (const item of this.snapshot.items) {
      if (item.removedAt !== null) continue;
      if (item.category) categories.add(item.category);
      if (item.rarityName) rarities.add(item.rarityName);
    }
    return {
      categories: [...categories].sort(),
      rarities: [...rarities].sort(),
    };
  }
}
