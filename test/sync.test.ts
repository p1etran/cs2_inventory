import { beforeEach, describe, expect, it } from 'vitest';
import { Catalog } from '../src/catalog/catalog.js';
import { emptyCatalogIndex } from '../src/catalog/types.js';
import { openDatabase, type Db } from '../src/db/database.js';
import { listContainers, searchItems } from '../src/db/repo.js';
import { DEF } from '../src/domain/attributes.js';
import type { RawEconItem } from '../src/domain/econ.js';
import type { GcClient } from '../src/steam/gc.js';
import { runSync } from '../src/sync/sync.js';
import { econItem } from './helpers.js';

function catalog(): Catalog {
  const index = emptyCatalogIndex();
  index.skins['7:44'] = { name: 'AK-47 | Case Hardened' };
  index.weapons['7'] = { name: 'AK-47', star: false };
  return new Catalog(index);
}

interface FakeOptions {
  loose: RawEconItem[];
  caskets: RawEconItem[];
  contents: Record<string, RawEconItem[] | Error>;
}

/** Stands in for a live game-coordinator session. */
function fakeGc(options: FakeOptions): GcClient {
  const reads: string[] = [];
  const fake = {
    connectToGc: async () => {},
    get inventory() {
      return [...options.loose, ...options.caskets];
    },
    get caskets() {
      return options.caskets;
    },
    casketDelayMs: 0,
    readCasket: async (casketId: string) => {
      reads.push(casketId);
      const result = options.contents[casketId];
      if (result instanceof Error) throw result;
      return result ?? [];
    },
    disconnect: () => {},
    reads,
  };
  return fake as unknown as GcClient;
}

const unit = (id: string, count: number, label: string) =>
  econItem({ id, defIndex: DEF.STORAGE_UNIT, containedCount: count, customName: label });

const gun = (id: string, casketId?: string) =>
  econItem({ id, defIndex: 7, paintIndex: 44, wear: 0.2, ...(casketId ? { casketId } : {}) });

let db: Db;

beforeEach(() => {
  db = openDatabase(':memory:');
});

describe('runSync', () => {
  it('reads loose items and every storage unit', async () => {
    const gc = fakeGc({
      loose: [gun('1')],
      caskets: [unit('100', 2, 'knives')],
      contents: { '100': [gun('2', '100'), gun('3', '100')] },
    });

    const summary = await runSync({ db, gc, catalog: catalog(), steamId: '765' });

    expect(summary.totalItems).toBe(4); // one loose, one unit, two stored
    expect(summary.looseItems).toBe(2); // the loose gun and the unit itself
    expect(summary.containers).toEqual([
      { assetId: '100', label: 'knives', expected: 2, read: 2, error: null },
    ]);
    expect(searchItems(db, { containerId: '100' }).total).toBe(2);
    expect(listContainers(db)[0]).toMatchObject({ stored_count: 2, contained_count: 2 });
  });

  it('skips the read for an empty unit', async () => {
    const gc = fakeGc({ loose: [], caskets: [unit('100', 0, 'empty')], contents: {} });
    const summary = await runSync({ db, gc, catalog: catalog(), steamId: '765' });
    expect((gc as unknown as { reads: string[] }).reads).toEqual([]);
    expect(summary.containers[0]).toMatchObject({ expected: 0, read: 0, error: null });
  });

  it('deduplicates units the game coordinator preloaded into the inventory', async () => {
    // The GC sometimes pushes stored items into the inventory unprompted, so
    // the same asset can arrive twice in one sync.
    const stored = gun('2', '100');
    const gc = fakeGc({
      loose: [gun('1'), stored],
      caskets: [unit('100', 1, 'knives')],
      contents: { '100': [stored] },
    });

    const summary = await runSync({ db, gc, catalog: catalog(), steamId: '765' });
    expect(summary.totalItems).toBe(3);
    expect(searchItems(db, { containerId: '100' }).total).toBe(1);
  });

  it('records a unit that failed to read without losing its items', async () => {
    const first = fakeGc({
      loose: [gun('1')],
      caskets: [unit('100', 2, 'knives')],
      contents: { '100': [gun('2', '100'), gun('3', '100')] },
    });
    await runSync({ db, gc: first, catalog: catalog(), steamId: '765' });

    const second = fakeGc({
      loose: [gun('1')],
      caskets: [unit('100', 2, 'knives')],
      contents: { '100': new Error('Timed out reading storage unit 100') },
    });
    const summary = await runSync({ db, gc: second, catalog: catalog(), steamId: '765' });

    expect(summary.failedContainers).toBe(1);
    expect(summary.containers[0]?.error).toMatch(/Timed out/);
    // The two items we could not re-read must still be there, and must not
    // have been reported as removed.
    expect(summary.diff.removed).toHaveLength(0);
    expect(searchItems(db, { containerId: '100' }).total).toBe(2);
  });

  it('reports an item that genuinely left a unit we did read', async () => {
    const first = fakeGc({
      loose: [],
      caskets: [unit('100', 2, 'knives')],
      contents: { '100': [gun('2', '100'), gun('3', '100')] },
    });
    await runSync({ db, gc: first, catalog: catalog(), steamId: '765' });

    const second = fakeGc({
      loose: [],
      caskets: [unit('100', 1, 'knives')],
      contents: { '100': [gun('2', '100')] },
    });
    const summary = await runSync({ db, gc: second, catalog: catalog(), steamId: '765' });

    expect(summary.diff.removed.map((c) => c.assetId)).toEqual(['3']);
    expect(searchItems(db, { containerId: '100' }).total).toBe(1);
  });

  it('reports an item moved out of a unit as a move', async () => {
    const first = fakeGc({
      loose: [],
      caskets: [unit('100', 1, 'knives')],
      contents: { '100': [gun('2', '100')] },
    });
    await runSync({ db, gc: first, catalog: catalog(), steamId: '765' });

    const second = fakeGc({
      loose: [gun('2')],
      caskets: [unit('100', 0, 'knives')],
      contents: {},
    });
    const summary = await runSync({ db, gc: second, catalog: catalog(), steamId: '765' });

    expect(summary.diff.moved).toEqual([
      {
        assetId: '2',
        marketHashName: 'AK-47 | Case Hardened (Field-Tested)',
        fromContainer: '100',
        toContainer: null,
      },
    ]);
    expect(summary.diff.removed).toHaveLength(0);
  });

  it('marks the run as failed when the coordinator never connects', async () => {
    const gc = fakeGc({ loose: [], caskets: [], contents: {} });
    (gc as unknown as { connectToGc: () => Promise<void> }).connectToGc = async () => {
      throw new Error('Timed out connecting to the CS2 game coordinator');
    };

    await expect(runSync({ db, gc, catalog: catalog(), steamId: '765' })).rejects.toThrow(
      /Timed out connecting/,
    );
    const run = db.prepare('SELECT status, error FROM sync_runs ORDER BY id DESC LIMIT 1').get() as {
      status: string;
      error: string;
    };
    expect(run.status).toBe('failed');
    expect(run.error).toMatch(/Timed out connecting/);
  });
});
