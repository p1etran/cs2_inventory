// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../extension/src/store.js';
import type { ResolvedItem } from '../src/core.js';
import { installChromeStorage } from './extension-storage-helper.js';

/**
 * The browser query surface.
 *
 * It reimplements what `src/db/repo.ts` does in SQL, so these check the
 * behaviours that would diverge silently -- search word order, how nulls sort,
 * what counts as live. The parts that must be identical rather than merely
 * similar (`searchKey`, `diffPlacements`) are imported from the shared core
 * rather than reimplemented, so they cannot drift at all.
 */

function item(overrides: Partial<ResolvedItem> & { assetId: string }): ResolvedItem {
  return {
    defIndex: 7,
    paintIndex: 44,
    paintSeed: 100,
    floatValue: 0.2,
    quality: 4,
    rarity: 5,
    stattrak: false,
    souvenir: false,
    customName: null,
    containerId: null,
    isContainer: false,
    containedCount: null,
    tradableAfter: null,
    stickers: [],
    keychain: null,
    marketHashName: 'AK-47 | Redline (Field-Tested)',
    baseName: 'AK-47 | Redline',
    wearName: 'Field-Tested',
    rarityName: 'Classified',
    rarityColor: '#d32ce6',
    category: 'Rifle',
    imageUrl: null,
    resolved: true,
    ...overrides,
  } as ResolvedItem;
}

const noChanges = { added: [], removed: [], moved: [] };

let store: Store;

beforeEach(async () => {
  installChromeStorage();
  store = new Store();
  await store.load();
});

/** Puts items in without going through a sync. */
function seed(items: ResolvedItem[], at = '2026-01-01T00:00:00.000Z'): void {
  store.applySync(items, noChanges, at);
}

describe('search', () => {
  beforeEach(() => {
    seed([
      item({ assetId: '1', marketHashName: '★ Karambit | Fade (Factory New)', baseName: '★ Karambit | Fade', category: 'Knife', floatValue: 0.01 }),
      item({ assetId: '2', marketHashName: 'AK-47 | Redline (Field-Tested)', floatValue: 0.25 }),
      item({ assetId: '3', marketHashName: 'AWP | Asiimov (Well-Worn)', baseName: 'AWP | Asiimov', floatValue: 0.42, category: 'Sniper Rifle' }),
    ]);
  });

  it('matches every word in any order, which is how people actually type', () => {
    // The rule src/db/repo.ts uses: each whitespace-separated word must appear
    // somewhere, so a partial name in either order finds the item.
    expect(store.search({ query: 'kara fade' }).items.map((i) => i.assetId)).toEqual(['1']);
    expect(store.search({ query: 'fade kara' }).items.map((i) => i.assetId)).toEqual(['1']);
  });

  it('ignores the punctuation Steam names are full of', () => {
    // ★ and | would otherwise have to be typed exactly.
    expect(store.search({ query: 'karambit fade' }).total).toBe(1);
    expect(store.search({ query: 'ak 47 redline' }).total).toBe(1);
  });

  it('finds nothing when one word does not match', () => {
    expect(store.search({ query: 'karambit asiimov' }).total).toBe(0);
  });

  it('searches the name tag as well as the item name', () => {
    seed([item({ assetId: '4', customName: 'czarna dziura' })]);
    expect(store.search({ query: 'czarna' }).items.map((i) => i.assetId)).toEqual(['4']);
  });

  it('sorts by name by default, and by float when asked', () => {
    /*
     * The star that marks knives and gloves sorts before letters here, where
     * the server's SQLite sorts it after -- a deliberate divergence rather
     * than an oversight. Grouping the knives and gloves at the top of an
     * alphabetical list is useful in CS2, where they are the items worth
     * finding, and nothing depends on the two orders matching: the rule that
     * must agree is which items match a search, and that comes from the
     * shared `searchKey`.
     */
    expect(store.search({ sort: 'name' }).items.map((i) => i.assetId)).toEqual(['1', '2', '3']);
    expect(store.search({ sort: 'float' }).items.map((i) => i.assetId)).toEqual(['1', '2', '3']);
  });

  it('orders plain names alphabetically', () => {
    // Without the star involved, the two implementations agree exactly.
    seed([item({ assetId: '9', marketHashName: 'AUG | Chameleon (Minimal Wear)' })]);
    expect(
      store.search({ sort: 'name', location: 'all' }).items.map((i) => i.marketHashName),
    ).toEqual([
      '★ Karambit | Fade (Factory New)',
      'AK-47 | Redline (Field-Tested)',
      'AUG | Chameleon (Minimal Wear)',
      'AWP | Asiimov (Well-Worn)',
    ]);
  });

  it('sorts by value, most valuable first', () => {
    const prices = {
      '★ Karambit | Fade (Factory New)': 145_000,
      'AK-47 | Redline (Field-Tested)': 129,
    };
    // Scanning a list for what is worth something wants the expensive end.
    expect(store.search({ sort: 'value', prices }).items.map((i) => i.assetId)).toEqual([
      '1', '2', '3',
    ]);
  });

  it('puts unpriced items last when sorting by value', () => {
    const prices = { 'AK-47 | Redline (Field-Tested)': 129 };
    // Not as zero: an unpriced item would otherwise bury the cheap-but-known
    // ones at the bottom together, which is the wrong story.
    const order = store.search({ sort: 'value', prices }).items.map((i) => i.assetId);
    expect(order[0]).toBe('2');
  });

  it('puts items with no float last, not first', () => {
    // Sorting nulls as zero would float every sticker above every knife.
    seed([item({ assetId: '5', floatValue: null, marketHashName: 'Sticker | Titan (Holo)' })]);
    expect(store.search({ sort: 'float' }).items.at(-1)?.assetId).toBe('5');
  });

  it('pages without changing the total', () => {
    const page = store.search({ limit: 2, offset: 1 });
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(2);
  });
});

describe('filters', () => {
  beforeEach(() => {
    seed([
      item({ assetId: '1' }),
      item({ assetId: '2', containerId: '100' }),
      item({ assetId: '3', containerId: '100', stattrak: true }),
      item({ assetId: '4', souvenir: true, rarityName: 'Covert', category: 'Sniper Rifle' }),
      item({ assetId: '5', resolved: false, marketHashName: 'Unknown item 999' }),
      item({ assetId: '100', isContainer: true, containedCount: 2, customName: 'one', marketHashName: 'Storage Unit' }),
    ]);
  });

  it('separates loose from stored', () => {
    expect(store.search({ location: 'loose' }).items.map((i) => i.assetId).sort()).toEqual([
      '1', '100', '4', '5',
    ]);
    expect(store.search({ location: 'stored' }).items.map((i) => i.assetId).sort()).toEqual(['2', '3']);
  });

  it('restricts to one unit', () => {
    expect(store.search({ containerId: '100' }).total).toBe(2);
  });

  it('filters on the flags and facets', () => {
    expect(store.search({ stattrak: true }).items.map((i) => i.assetId)).toEqual(['3']);
    expect(store.search({ souvenir: true }).items.map((i) => i.assetId)).toEqual(['4']);
    expect(store.search({ rarity: 'Covert' }).items.map((i) => i.assetId)).toEqual(['4']);
    expect(store.search({ category: 'Sniper Rifle' }).items.map((i) => i.assetId)).toEqual(['4']);
    expect(store.search({ unresolvedOnly: true }).items.map((i) => i.assetId)).toEqual(['5']);
  });

  it('lists the facets actually present', () => {
    expect(store.listFacets()).toEqual({
      categories: ['Rifle', 'Sniper Rifle'],
      rarities: ['Classified', 'Covert'],
    });
  });
});

describe('removed items', () => {
  beforeEach(() => {
    seed([item({ assetId: '1' }), item({ assetId: '2' })]);
    store.applySync(
      [item({ assetId: '1' })],
      { added: [], moved: [], removed: [{ assetId: '2', marketHashName: 'AK-47 | Redline (Field-Tested)', fromContainer: null }] },
      '2026-02-01T00:00:00.000Z',
    );
  });

  it('hides them by default and shows them on request', () => {
    expect(store.search().items.map((i) => i.assetId)).toEqual(['1']);
    expect(store.search({ includeRemoved: true }).total).toBe(2);
  });

  it('keeps them out of the stats and facets', () => {
    expect(store.getStats().totalItems).toBe(1);
  });

  it('marks when they went, rather than deleting the row', () => {
    // Keeping the row is what lets the change log say what an item was.
    const removed = store.search({ includeRemoved: true }).items.find((i) => i.assetId === '2');
    expect(removed?.removedAt).toBe('2026-02-01T00:00:00.000Z');
  });

  it('brings one back if it turns up again', () => {
    store.applySync([item({ assetId: '2' })], noChanges, '2026-03-01T00:00:00.000Z');
    expect(store.search().items.map((i) => i.assetId).sort()).toEqual(['1', '2']);
  });
});

describe('storage units', () => {
  it('reports both counts, so a short read is visible', () => {
    seed([
      item({ assetId: '100', isContainer: true, containedCount: 5, customName: 'partly read' }),
      item({ assetId: '1', containerId: '100' }),
      item({ assetId: '2', containerId: '100' }),
    ]);

    // The game says five, we hold two. Showing only "2 items" would read as a
    // complete unit, which is exactly the mistake worth preventing.
    expect(store.listContainers()).toEqual([
      { assetId: '100', label: 'partly read', containedCount: 5, storedCount: 2, value: null },
    ]);
  });

  it('names an unlabelled unit rather than showing a blank', () => {
    seed([item({ assetId: '100', isContainer: true, containedCount: 0, customName: null })]);
    expect(store.listContainers()[0]?.label).toBe('Storage Unit');
  });

  it('does not count a removed item as still stored', () => {
    seed([
      item({ assetId: '100', isContainer: true, containedCount: 2, customName: 'one' }),
      item({ assetId: '1', containerId: '100' }),
      item({ assetId: '2', containerId: '100' }),
    ]);
    store.applySync(
      [item({ assetId: '100', isContainer: true, containedCount: 1, customName: 'one' }), item({ assetId: '1', containerId: '100' })],
      { added: [], moved: [], removed: [{ assetId: '2', marketHashName: 'x', fromContainer: '100' }] },
      '2026-02-01T00:00:00.000Z',
    );

    // Counting a removed item would show the unit as fuller than it is, and
    // hide the very gap this column exists to reveal.
    expect(store.listContainers()).toEqual([
      { assetId: '100', label: 'one', containedCount: 1, storedCount: 1, value: null },
    ]);
  });

  it('sorts by label, case-insensitively', () => {
    seed([
      item({ assetId: '1', isContainer: true, customName: 'zebra' }),
      item({ assetId: '2', isContainer: true, customName: 'Apple' }),
    ]);
    expect(store.listContainers().map((c) => c.label)).toEqual(['Apple', 'zebra']);
  });
});

describe('stacks', () => {
  it('groups by name, most numerous first', () => {
    seed([
      item({ assetId: '1' }),
      item({ assetId: '2' }),
      item({ assetId: '3', marketHashName: 'AWP | Asiimov (Well-Worn)' }),
    ]);

    expect(store.listStacks().rows).toEqual([
      expect.objectContaining({ marketHashName: 'AK-47 | Redline (Field-Tested)', count: 2 }),
      expect.objectContaining({ marketHashName: 'AWP | Asiimov (Well-Worn)', count: 1 }),
    ]);
  });

  it('respects the same filters as search', () => {
    seed([item({ assetId: '1', containerId: '100' }), item({ assetId: '2' })]);
    expect(store.listStacks({ containerId: '100' }).rows[0]?.count).toBe(1);
  });
});

describe('stats', () => {
  it('counts what is where', () => {
    seed([
      item({ assetId: '1' }),
      item({ assetId: '2', containerId: '100', stattrak: true }),
      item({ assetId: '3', souvenir: true }),
      item({ assetId: '4', resolved: false }),
      item({ assetId: '100', isContainer: true, containedCount: 1 }),
    ]);

    expect(store.getStats()).toMatchObject({
      totalItems: 5,
      looseItems: 4,
      storedItems: 1,
      containers: 1,
      unresolved: 1,
      stattrak: 1,
      souvenir: 1,
    });
  });
});

describe('persistence', () => {
  it('survives a reload', async () => {
    seed([item({ assetId: '1' })]);
    await store.save();

    const reopened = new Store();
    await reopened.load();
    expect(reopened.search().items.map((i) => i.assetId)).toEqual(['1']);
  });

  it('starts fresh rather than misreading an index from an older shape', async () => {
    // Shaped so it would be returned if the version were ignored -- an item
    // that fails the live check for another reason would pass this test by
    // accident and prove nothing.
    await chrome.storage.local.set({
      inventory: {
        version: 0,
        items: [{ ...item({ assetId: 'old' }), searchText: 'old', firstSeen: '', lastSeen: '', removedAt: null }],
        events: [],
        runs: [],
      },
    });

    const reopened = new Store();
    await reopened.load();
    // Rebuilding from a sync is cheap; reading the wrong shape is not.
    expect(reopened.search().total).toBe(0);
  });

  it('keeps first-seen across syncs, so "recent" means something', async () => {
    seed([item({ assetId: '1' })], '2026-01-01T00:00:00.000Z');
    store.applySync([item({ assetId: '1' })], noChanges, '2026-06-01T00:00:00.000Z');

    const stored = store.search().items[0];
    expect(stored?.firstSeen).toBe('2026-01-01T00:00:00.000Z');
    expect(stored?.lastSeen).toBe('2026-06-01T00:00:00.000Z');
  });

  it('holds an inventory the size of a real one', async () => {
    // The account this was built for has ~16,000 items across 22 units. At
    // roughly 840 bytes each that is past the 10 MB chrome.storage.local
    // allows by default, which is why the manifest asks for unlimitedStorage
    // -- and why this is worth asserting rather than discovering at the end
    // of a two-minute sync.
    seed(
      Array.from({ length: 16_000 }, (_, i) =>
        item({
          assetId: String(40_000_000_000 + i),
          containerId: String(28_000_000_000 + (i % 22)),
          marketHashName: 'Antwerp 2022 Contenders Sticker Capsule',
        }),
      ),
    );
    await store.save();

    const reopened = new Store();
    await reopened.load();
    expect(reopened.getStats().totalItems).toBe(16_000);
    expect(reopened.search({ query: 'antwerp contenders' }).total).toBe(16_000);
  });

  it('says what went wrong if the index cannot be written', async () => {
    seed([item({ assetId: '1' })]);
    const storage = chrome.storage.local as unknown as { set: () => Promise<void> };
    storage.set = () => Promise.reject(new Error('QUOTA_BYTES quota exceeded'));

    // A sync that did two minutes of work and then failed obscurely is the
    // worst version of this.
    await expect(store.save()).rejects.toThrow(/Could not save the index \(1 items\).*quota/);
  });

  it('forgets everything when cleared', async () => {
    seed([item({ assetId: '1' })]);
    await store.clear();

    const reopened = new Store();
    await reopened.load();
    expect(reopened.search().total).toBe(0);
  });
});

describe('the change log', () => {
  it('records what happened, newest first', () => {
    store.applySync(
      [item({ assetId: '1' })],
      {
        added: [{ assetId: '1', marketHashName: 'a', toContainer: null }],
        moved: [{ assetId: '2', marketHashName: 'b', fromContainer: '100', toContainer: '200' }],
        removed: [{ assetId: '3', marketHashName: 'c', fromContainer: '100' }],
      },
      '2026-01-01T00:00:00.000Z',
    );

    expect(store.recentEvents().map((e) => e.kind)).toEqual(['added', 'moved', 'removed']);
  });

  it('does not grow without bound', () => {
    for (let run = 0; run < 30; run += 1) {
      store.applySync(
        [],
        {
          added: Array.from({ length: 100 }, (_, i) => ({
            assetId: `${run}-${i}`,
            marketHashName: 'x',
            toContainer: null,
          })),
          moved: [],
          removed: [],
        },
        `2026-01-${String(run + 1).padStart(2, '0')}T00:00:00.000Z`,
      );
    }

    // The index is the record; the log is a convenience and is capped so the
    // stored JSON cannot grow forever.
    expect(store.recentEvents(10_000).length).toBeLessThanOrEqual(2_000);
  });
});
