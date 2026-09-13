// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { Catalog, emptyCatalogIndex } from '../src/core.js';
import { Store } from '../extension/src/store.js';
import { runSync } from '../extension/src/sync.js';
import type { GcClient, GcEconItem } from '../extension/src/steam/gc.js';
import { ATTR, DEF } from '../src/domain/attributes.js';
import { installChromeStorage } from './extension-storage-helper.js';

/**
 * The sync loop, against a stand-in coordinator.
 *
 * The rule worth the most here is the partial-failure one: a storage unit that
 * fails to read must leave its stored items exactly as they were. Getting that
 * wrong reports a thousand items as removed because one read timed out, and it
 * would look entirely plausible in the UI.
 */

const u32 = (value: number): Uint8Array => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
};

const nameBytes = (text: string): Uint8Array => {
  const body = new TextEncoder().encode(text);
  const out = new Uint8Array(2 + body.length);
  new DataView(out.buffer).setUint16(0, body.length, true);
  out.set(body, 2);
  return out;
};

function econItem(fields: {
  id: string;
  defIndex?: number;
  casketId?: string;
  containedCount?: number;
  customName?: string;
}): GcEconItem {
  const attribute: { def_index: number; value_bytes: Uint8Array }[] = [];
  if (fields.casketId !== undefined) {
    const id = BigInt(fields.casketId);
    attribute.push({ def_index: ATTR.CASKET_ID_LOW, value_bytes: u32(Number(id & 0xffffffffn)) });
    attribute.push({ def_index: ATTR.CASKET_ID_HIGH, value_bytes: u32(Number(id >> 32n)) });
  }
  if (fields.containedCount !== undefined) {
    attribute.push({ def_index: ATTR.CASKET_ITEM_COUNT, value_bytes: u32(fields.containedCount) });
  }
  if (fields.customName !== undefined) {
    attribute.push({ def_index: ATTR.CUSTOM_NAME, value_bytes: nameBytes(fields.customName) });
  }
  return { id: fields.id, def_index: fields.defIndex ?? 7, quality: 4, attribute };
}

/** A coordinator whose reads are scripted, including which ones fail. */
function fakeGc(options: {
  loose: GcEconItem[];
  units: { id: string; label: string; count: number; contents: GcEconItem[]; fails?: number }[];
}) {
  const unitItems = options.units.map((unit) =>
    econItem({
      id: unit.id,
      defIndex: DEF.STORAGE_UNIT,
      containedCount: unit.count,
      customName: unit.label,
    }),
  );
  const revealed = new Map<string, GcEconItem[]>();
  const attempts = new Map<string, number>();
  const reads: string[] = [];

  const gc = {
    get items(): GcEconItem[] {
      return [...options.loose, ...unitItems, ...[...revealed.values()].flat()];
    },
    get storageUnits(): GcEconItem[] {
      return unitItems;
    },
    itemsIn(casketId: string): GcEconItem[] {
      return revealed.get(casketId) ?? [];
    },
    loadStorageUnit(casketId: string): Promise<void> {
      reads.push(casketId);
      const unit = options.units.find((candidate) => candidate.id === casketId);
      const seen = (attempts.get(casketId) ?? 0) + 1;
      attempts.set(casketId, seen);

      if (unit && unit.fails !== undefined && seen <= unit.fails) {
        return Promise.reject(new Error(`Timed out loading storage unit ${casketId}`));
      }
      revealed.set(casketId, unit?.contents ?? []);
      return Promise.resolve();
    },
  };

  return { gc: gc as unknown as GcClient, reads, attempts };
}

/**
 * A catalog with no schema loaded.
 *
 * Every item falls back to a placeholder name, which is exactly right here:
 * these tests are about placement and reconciliation, and naming has its own.
 */
const catalog = new Catalog(emptyCatalogIndex());

let store: Store;

beforeEach(async () => {
  installChromeStorage();
  store = new Store();
  await store.load();
});

const sync = (gc: GcClient, overrides: Partial<Parameters<typeof runSync>[0]> = {}) =>
  runSync({
    gc,
    store,
    catalog,
    steamId: '765',
    delayMs: 0,
    sleep: () => Promise.resolve(),
    ...overrides,
  });

describe('a full sync', () => {
  it('reads every unit and counts what it found', async () => {
    const { gc, reads } = fakeGc({
      loose: [econItem({ id: '1' })],
      units: [
        { id: '100', label: 'one', count: 2, contents: [econItem({ id: '11', casketId: '100' }), econItem({ id: '12', casketId: '100' })] },
        { id: '200', label: 'two', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });

    const summary = await sync(gc);

    expect(reads).toEqual(['100', '200']);
    // One loose item, two units, and the three items inside them.
    expect(summary.totalItems).toBe(6);
    expect(summary.looseItems).toBe(3); // the loose item and the two units
    expect(summary.containers.map((c) => [c.label, c.expected, c.read])).toEqual([
      ['one', 2, 2],
      ['two', 1, 1],
    ]);
  });

  it('does not ask about a unit the game says is empty', async () => {
    const { gc, reads } = fakeGc({
      loose: [],
      units: [{ id: '100', label: 'empty', count: 0, contents: [] }],
    });

    await sync(gc);
    // A request per empty unit is pure rate-limit budget spent on nothing.
    expect(reads).toEqual([]);
  });

  it('spaces the reads, because the coordinator rate-limits', async () => {
    const waits: number[] = [];
    const { gc } = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'one', count: 1, contents: [econItem({ id: '11', casketId: '100' })] },
        { id: '200', label: 'two', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
        { id: '300', label: 'three', count: 1, contents: [econItem({ id: '31', casketId: '300' })] },
      ],
    });

    await sync(gc, { delayMs: 1100, sleep: (ms) => (waits.push(ms), Promise.resolve()) });

    // Between reads, not after the last one.
    expect(waits).toEqual([1100, 1100]);
  });

  it('retries a unit that times out, backing off further each time', async () => {
    const waits: number[] = [];
    const { gc, attempts } = fakeGc({
      loose: [],
      units: [
        {
          id: '100',
          label: 'flaky',
          count: 1,
          contents: [econItem({ id: '11', casketId: '100' })],
          fails: 2,
        },
      ],
    });

    const summary = await sync(gc, {
      delayMs: 1100,
      sleep: (ms) => (waits.push(ms), Promise.resolve()),
    });

    expect(attempts.get('100')).toBe(3);
    expect(waits).toEqual([2200, 4400]);
    expect(summary.containers[0]?.error).toBeNull();
    expect(summary.containers[0]?.read).toBe(1);
  });

  it('gives up on a unit after its attempts, and says which', async () => {
    const { gc } = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'broken', count: 5, contents: [], fails: 99 },
        { id: '200', label: 'fine', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });

    const summary = await sync(gc);

    expect(summary.failedContainers).toBe(1);
    expect(summary.containers[0]).toMatchObject({ label: 'broken', read: 0 });
    expect(summary.containers[0]?.error).toMatch(/Timed out/);
    // One bad unit must not stop the rest of the sync.
    expect(summary.containers[1]).toMatchObject({ label: 'fine', read: 1, error: null });
  });

  it('stops when cancelled', async () => {
    const controller = new AbortController();
    const { gc, reads } = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'one', count: 1, contents: [econItem({ id: '11', casketId: '100' })] },
        { id: '200', label: 'two', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });

    await expect(
      sync(gc, {
        signal: controller.signal,
        sleep: () => {
          controller.abort();
          return Promise.resolve();
        },
      }),
    ).rejects.toThrow(/cancelled/i);
    expect(reads).toEqual(['100']);
  });
});

describe('a unit that could not be read', () => {
  /** Syncs once with everything readable, then again with one unit broken. */
  async function syncThenFail() {
    const contents = [
      econItem({ id: '11', casketId: '100' }),
      econItem({ id: '12', casketId: '100' }),
    ];
    const first = fakeGc({
      loose: [econItem({ id: '1' })],
      units: [
        { id: '100', label: 'kept', count: 2, contents },
        { id: '200', label: 'other', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });
    await sync(first.gc);

    const second = fakeGc({
      loose: [econItem({ id: '1' })],
      units: [
        { id: '100', label: 'kept', count: 2, contents, fails: 99 },
        { id: '200', label: 'other', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });
    return sync(second.gc);
  }

  it('leaves its items alone rather than reporting them removed', async () => {
    const summary = await syncThenFail();

    // The whole point: one timed-out read must not look like two items gone.
    expect(summary.removed).toBe(0);
    expect(store.recentEvents().filter((event) => event.kind === 'removed')).toEqual([]);
  });

  it('keeps those items searchable, and still marked as stored there', async () => {
    await syncThenFail();

    const stored = store.search({ containerId: '100' });
    expect(stored.total).toBe(2);
    expect(stored.items.every((item) => item.removedAt === null)).toBe(true);
  });

  it('still reports an item that really did leave a unit it did read', async () => {
    const before = fakeGc({
      loose: [],
      units: [
        {
          id: '200',
          label: 'other',
          count: 2,
          contents: [econItem({ id: '21', casketId: '200' }), econItem({ id: '22', casketId: '200' })],
        },
      ],
    });
    await sync(before.gc);

    const after = fakeGc({
      loose: [],
      units: [{ id: '200', label: 'other', count: 1, contents: [econItem({ id: '21', casketId: '200' })] }],
    });
    const summary = await sync(after.gc);

    // Read successfully, so a missing item is genuinely missing.
    expect(summary.removed).toBe(1);
    expect(store.recentEvents()[0]).toMatchObject({ kind: 'removed', assetId: '22' });
  });
});

describe('what a sync records', () => {
  it('notices an item moving between units', async () => {
    const first = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'one', count: 1, contents: [econItem({ id: '11', casketId: '100' })] },
        { id: '200', label: 'two', count: 0, contents: [] },
      ],
    });
    await sync(first.gc);

    const second = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'one', count: 0, contents: [] },
        { id: '200', label: 'two', count: 1, contents: [econItem({ id: '11', casketId: '200' })] },
      ],
    });
    const summary = await sync(second.gc);

    // An asset id is stable across a move, so this is one move, not a
    // removal plus an addition.
    expect([summary.added, summary.removed, summary.moved]).toEqual([0, 0, 1]);
    expect(store.recentEvents()[0]).toMatchObject({
      kind: 'moved',
      assetId: '11',
      fromContainer: '100',
      toContainer: '200',
    });
  });

  it('keeps a run summary, newest first', async () => {
    const { gc } = fakeGc({ loose: [econItem({ id: '1' })], units: [] });
    await sync(gc);
    await sync(gc);

    expect(store.runs).toHaveLength(2);
    expect(store.runs[0]?.steamId).toBe('765');
    expect((store.runs[0]?.at ?? '') >= (store.runs[1]?.at ?? '')).toBe(true);
  });

  it('survives a reload, because it is written as it goes', async () => {
    const { gc } = fakeGc({
      loose: [econItem({ id: '1' })],
      units: [{ id: '100', label: 'one', count: 1, contents: [econItem({ id: '11', casketId: '100' })] }],
    });
    await sync(gc);

    const reopened = new Store();
    await reopened.load();
    expect(reopened.getStats().totalItems).toBe(3);
    expect(reopened.listContainers()).toEqual([
      { assetId: '100', label: 'one', containedCount: 1, storedCount: 1, value: null },
    ]);
  });
});

describe('progress', () => {
  it('names each unit as it goes, so a long sync is not a blank wait', async () => {
    const messages: string[] = [];
    const { gc } = fakeGc({
      loose: [],
      units: [
        { id: '100', label: 'first', count: 1, contents: [econItem({ id: '11', casketId: '100' })] },
        { id: '200', label: 'second', count: 1, contents: [econItem({ id: '21', casketId: '200' })] },
      ],
    });

    await sync(gc, { onProgress: (message) => messages.push(message) });

    expect(messages).toContain('Reading 1/2: first (1 items)');
    expect(messages).toContain('Reading 2/2: second (1 items)');
  });

  it('says when a unit came back short of what the game claims', async () => {
    const messages: string[] = [];
    const { gc } = fakeGc({
      loose: [],
      units: [{ id: '100', label: 'short', count: 5, contents: [econItem({ id: '11', casketId: '100' })] }],
    });

    await sync(gc, { onProgress: (message) => messages.push(message) });

    // Silently storing one of five would read as a complete unit later.
    expect(messages).toContain('  read 1 of 5');
  });
});

describe('cancelling mid-sync', () => {
  it('leaves the previous index intact', async () => {
    const { gc } = fakeGc({
      loose: [econItem({ id: '1' })],
      units: [{ id: '100', label: 'one', count: 1, contents: [econItem({ id: '11', casketId: '100' })] }],
    });
    await sync(gc);
    const before = store.getStats().totalItems;

    const controller = new AbortController();
    controller.abort();
    await expect(sync(gc, { signal: controller.signal })).rejects.toThrow();

    // Nothing is written until the whole read finishes, so an abort cannot
    // leave a half-built index behind.
    const reopened = new Store();
    await reopened.load();
    expect(reopened.getStats().totalItems).toBe(before);
  });
});
