import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { openDatabase, type Db } from '../src/db/database.js';
import { upsertItems } from '../src/db/repo.js';
import { createApp } from '../src/server/server.js';
import type { ResolvedItem } from '../src/domain/types.js';

function item(overrides: Partial<ResolvedItem> & { assetId: string }): ResolvedItem {
  return {
    defIndex: 7,
    paintIndex: 44,
    paintSeed: 1,
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

let db: Db;
let base: string;
let server: ReturnType<ReturnType<typeof createApp>['listen']>;

beforeAll(async () => {
  db = openDatabase(':memory:');
  upsertItems(
    db,
    [
      item({
        assetId: 'unit-1',
        isContainer: true,
        containedCount: 1,
        customName: 'overpay stash',
        marketHashName: 'Storage Unit',
      }),
      item({ assetId: '1', containerId: 'unit-1' }),
      item({ assetId: '2', marketHashName: 'AWP | Asiimov (Field-Tested)', stattrak: true }),
    ],
    '2026-01-01T00:00:00.000Z',
  );

  const app = createApp(db, loadConfig({ dataDir: '/tmp/cs2inv-test' }));
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
});

const get = async (path: string) => {
  const response = await fetch(`${base}${path}`);
  expect(response.ok).toBe(true);
  return response.json();
};

describe('http api', () => {
  it('serves stats', async () => {
    expect(await get('/api/stats')).toMatchObject({ totalItems: 3, storedItems: 1, containers: 1 });
  });

  it('serves the storage unit list', async () => {
    const containers = (await get('/api/containers')) as { label: string }[];
    expect(containers[0]?.label).toBe('overpay stash');
  });

  it('searches items', async () => {
    const result = (await get('/api/items?q=asiimov')) as { total: number };
    expect(result.total).toBe(1);
  });

  it('applies filters from the query string', async () => {
    expect((await get('/api/items?stattrak=1')).total).toBe(1);
    expect((await get('/api/items?location=stored')).total).toBe(1);
    expect((await get('/api/items?container=unit-1')).total).toBe(1);
  });

  it('groups duplicates', async () => {
    const result = (await get('/api/stacks')) as { total: number };
    expect(result.total).toBe(3);
  });

  it('serves facets for the filter menus', async () => {
    const facets = (await get('/api/facets')) as { categories: string[]; rarities: string[] };
    expect(facets.categories).toContain('Rifles');
    expect(facets.rarities).toContain('Classified');
  });

  it('exports every matching item as CSV', async () => {
    const response = await fetch(`${base}/api/export`);
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('content-disposition')).toMatch(
      /attachment; filename="cs2-inventory-\d{4}-\d{2}-\d{2}\.csv"/,
    );

    // Response.text() strips a leading BOM, so the bytes are what to assert on.
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const lines = (await response.text()).trim().split('\n');
    expect(lines[0]).toBe(
      'asset_id,market_hash_name,exterior,float,paint_seed,stattrak,souvenir,rarity,category,location,name_tag,first_seen',
    );
    expect(lines).toHaveLength(4);
    expect(lines.some((line) => line.includes('overpay stash'))).toBe(true);
  });

  it('exports only what the filters match', async () => {
    const body = await (await fetch(`${base}/api/export?q=asiimov`)).text();
    const lines = body.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('AWP | Asiimov (Field-Tested)');
  });

  it('ignores the paging window an export inherits from the item list', async () => {
    const body = await (await fetch(`${base}/api/export?limit=1&offset=2`)).text();
    expect(body.trim().split('\n')).toHaveLength(4);
  });

  it('exports JSON on request', async () => {
    const response = await fetch(`${base}/api/export?format=json`);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('content-disposition')).toContain('.json"');
    const items = (await response.json()) as { asset_id: string }[];
    expect(items).toHaveLength(3);
  });

  it('reports an idle sync', async () => {
    expect(await get('/api/sync')).toMatchObject({ state: 'idle' });
  });

  it('serves the web UI', async () => {
    const response = await fetch(`${base}/`);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('CS2 Inventory');
  });
});
