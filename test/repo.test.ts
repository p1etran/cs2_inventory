import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../src/db/database.js';
import {
  getStats,
  listContainers,
  listFacets,
  listStacks,
  livePlacements,
  markRemoved,
  recordEvents,
  searchItems,
  startSyncRun,
  finishSyncRun,
  upsertItems,
} from '../src/db/repo.js';
import type { ResolvedItem } from '../src/domain/types.js';

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
    stickers: [],
    keychain: null,
    musicId: null,
    tintId: null,
    tradableAfter: null,
    origin: null,
    position: null,
    marketHashName: 'AK-47 | Case Hardened (Field-Tested)',
    baseName: 'AK-47 | Case Hardened',
    wearName: 'Field-Tested',
    rarityName: 'Classified',
    rarityColor: '#d32ce6',
    category: 'Rifles',
    imageUrl: null,
    resolved: true,
    ...overrides,
  };
}

const NOW = '2026-01-01T00:00:00.000Z';

let db: Db;

beforeEach(() => {
  db = openDatabase(':memory:');
});

describe('upsertItems and search', () => {
  it('stores items and finds them by partial words in any order', () => {
    upsertItems(db, [item({ assetId: '1' })], NOW);
    expect(searchItems(db, { query: 'hardened ak' }).total).toBe(1);
    expect(searchItems(db, { query: 'case hard' }).total).toBe(1);
    expect(searchItems(db, { query: 'awp' }).total).toBe(0);
  });

  it('finds items by the label of the unit they are in', () => {
    upsertItems(
      db,
      [
        item({
          assetId: 'unit-1',
          isContainer: true,
          containedCount: 1,
          customName: 'overpay stash',
          marketHashName: 'Storage Unit',
          baseName: 'Storage Unit',
          paintIndex: null,
          floatValue: null,
          wearName: null,
        }),
        item({ assetId: '1', containerId: 'unit-1' }),
      ],
      NOW,
    );
    expect(searchItems(db, { query: 'overpay' }).total).toBe(2);
  });

  it('is idempotent and keeps the first-seen timestamp', () => {
    upsertItems(db, [item({ assetId: '1' })], NOW);
    upsertItems(db, [item({ assetId: '1', floatValue: 0.3 })], '2026-02-01T00:00:00.000Z');

    const result = searchItems(db);
    expect(result.total).toBe(1);
    expect(result.items[0]?.first_seen).toBe(NOW);
    expect(result.items[0]?.last_seen).toBe('2026-02-01T00:00:00.000Z');
    expect(result.items[0]?.float_value).toBe(0.3);
  });

  it('filters by location, rarity and StatTrak', () => {
    upsertItems(
      db,
      [
        item({ assetId: '1' }),
        item({ assetId: '2', containerId: 'unit-1' }),
        item({ assetId: '3', stattrak: true, rarityName: 'Covert' }),
      ],
      NOW,
    );
    expect(searchItems(db, { location: 'loose' }).total).toBe(2);
    expect(searchItems(db, { location: 'stored' }).total).toBe(1);
    expect(searchItems(db, { stattrak: true }).total).toBe(1);
    expect(searchItems(db, { rarity: 'Covert' }).total).toBe(1);
    expect(searchItems(db, { containerId: 'unit-1' }).total).toBe(1);
  });

  it('hides removed items but keeps them for history', () => {
    upsertItems(db, [item({ assetId: '1' }), item({ assetId: '2' })], NOW);
    markRemoved(db, ['2'], NOW);

    expect(searchItems(db).total).toBe(1);
    expect(searchItems(db, { includeRemoved: true }).total).toBe(2);
    expect(livePlacements(db).size).toBe(1);
  });

  it('brings an item back when it reappears in a later sync', () => {
    upsertItems(db, [item({ assetId: '1' })], NOW);
    markRemoved(db, ['1'], NOW);
    upsertItems(db, [item({ assetId: '1' })], '2026-03-01T00:00:00.000Z');
    expect(searchItems(db).total).toBe(1);
  });
});

describe('listContainers', () => {
  it('shows the gap between what the game reports and what we read', () => {
    upsertItems(
      db,
      [
        item({
          assetId: 'unit-1',
          isContainer: true,
          containedCount: 3,
          customName: 'knives',
          marketHashName: 'Storage Unit',
        }),
        item({ assetId: '1', containerId: 'unit-1' }),
      ],
      NOW,
    );

    const containers = listContainers(db);
    expect(containers).toHaveLength(1);
    expect(containers[0]).toMatchObject({ label: 'knives', contained_count: 3, stored_count: 1 });
  });

  it('falls back to a generic label for unnamed units', () => {
    upsertItems(
      db,
      [item({ assetId: 'unit-1', isContainer: true, containedCount: 0, marketHashName: 'Storage Unit' })],
      NOW,
    );
    expect(listContainers(db)[0]?.label).toBe('Storage Unit');
  });
});

describe('listStacks', () => {
  it('groups duplicates and counts the places they sit in', () => {
    upsertItems(
      db,
      [
        item({ assetId: '1' }),
        item({ assetId: '2', containerId: 'unit-1' }),
        item({ assetId: '3', containerId: 'unit-1' }),
        item({ assetId: '4', marketHashName: 'AWP | Asiimov (Field-Tested)' }),
      ],
      NOW,
    );

    const { rows, total } = listStacks(db);
    expect(total).toBe(2);
    expect(rows[0]).toMatchObject({
      market_hash_name: 'AK-47 | Case Hardened (Field-Tested)',
      count: 3,
      containers: 2,
    });
  });
});

describe('getStats and facets', () => {
  it('summarises the current inventory', () => {
    upsertItems(
      db,
      [
        item({ assetId: 'unit-1', isContainer: true, containedCount: 1, marketHashName: 'Storage Unit' }),
        item({ assetId: '1', containerId: 'unit-1' }),
        item({ assetId: '2', resolved: false, marketHashName: 'Unknown item 9999' }),
      ],
      NOW,
    );
    const runId = startSyncRun(db, NOW, '765');
    finishSyncRun(db, runId, NOW, {
      totalItems: 3,
      containers: 1,
      added: 3,
      removed: 0,
      moved: 0,
      unresolved: 1,
    });

    const stats = getStats(db);
    expect(stats).toMatchObject({
      totalItems: 3,
      looseItems: 2,
      storedItems: 1,
      containers: 1,
      unresolved: 1,
      lastSyncAt: NOW,
    });

    const facets = listFacets(db);
    expect(facets.categories).toContain('Rifles');
    expect(facets.rarities).toContain('Classified');
  });
});

describe('recordEvents', () => {
  it('writes one row per change', () => {
    const runId = startSyncRun(db, NOW, '765');
    recordEvents(db, runId, NOW, {
      added: [{ assetId: '1', marketHashName: 'A', toContainer: null }],
      removed: [{ assetId: '2', marketHashName: 'B', fromContainer: 'unit-1' }],
      moved: [{ assetId: '3', marketHashName: 'C', fromContainer: null, toContainer: 'unit-1' }],
    });

    const rows = db.prepare('SELECT type, asset_id FROM events ORDER BY id').all() as {
      type: string;
      asset_id: string;
    }[];
    expect(rows).toEqual([
      { type: 'added', asset_id: '1' },
      { type: 'removed', asset_id: '2' },
      { type: 'moved', asset_id: '3' },
    ]);
  });
});
