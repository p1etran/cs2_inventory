import type { Catalog } from '../catalog/catalog.js';
import type { Db } from '../db/database.js';
import { diffPlacements, type InventoryDiff, type Placement } from '../domain/diff.js';
import { normalizeEconItem, type RawEconItem } from '../domain/econ.js';
import type { ResolvedItem } from '../domain/types.js';
import {
  failSyncRun,
  finishSyncRun,
  livePlacements,
  markRemoved,
  recordEvents,
  startSyncRun,
  upsertItems,
} from '../db/repo.js';
import type { GcClient } from '../steam/gc.js';
import { sleep } from '../util/log.js';

export interface ContainerReport {
  assetId: string;
  label: string;
  /** What the game says the unit holds. */
  expected: number;
  /** What we actually read out of it. */
  read: number;
  error: string | null;
}

export interface SyncSummary {
  runId: number;
  steamId: string;
  totalItems: number;
  looseItems: number;
  containers: ContainerReport[];
  failedContainers: number;
  unresolved: number;
  diff: InventoryDiff;
}

export interface SyncOptions {
  db: Db;
  gc: GcClient;
  catalog: Catalog;
  steamId: string;
  onProgress?: (message: string) => void;
}

function toPlacements(items: ResolvedItem[]): Map<string, Placement> {
  return new Map(
    items.map((item) => [
      item.assetId,
      { containerId: item.containerId, marketHashName: item.marketHashName },
    ]),
  );
}

/**
 * Reads the whole account: the loose inventory plus the contents of every
 * storage unit, then reconciles it against what we stored last time.
 */
export async function runSync(options: SyncOptions): Promise<SyncSummary> {
  const { db, gc, catalog, steamId } = options;
  const report = options.onProgress ?? (() => {});
  const startedAt = new Date().toISOString();
  const runId = startSyncRun(db, startedAt, steamId);

  try {
    report('connecting to the CS2 game coordinator');
    await gc.connectToGc();

    // Asset ids are unique per item, so a map also dedupes the overlap between
    // the base inventory and units the GC decided to preload for us.
    const raw = new Map<string, RawEconItem>();
    for (const item of gc.inventory) {
      raw.set(String(item.id), item);
    }

    // Normalize the units through the same path as everything else rather
    // than trusting the convenience fields the client library happens to set.
    const caskets = gc.caskets.map((item) => normalizeEconItem(item));
    report(`found ${raw.size} loose items and ${caskets.length} storage units`);

    const containers: ContainerReport[] = [];
    const enumerated = new Set<string>();

    for (const [index, casket] of caskets.entries()) {
      const assetId = casket.assetId;
      const expected = casket.containedCount ?? 0;
      const label = casket.customName ?? 'Storage Unit';

      if (expected === 0) {
        containers.push({ assetId, label, expected: 0, read: 0, error: null });
        enumerated.add(assetId);
        continue;
      }

      report(`reading storage unit ${index + 1}/${caskets.length}: ${label} (${expected} items)`);
      try {
        const contents = await gc.readCasket(assetId);
        for (const item of contents) {
          raw.set(String(item.id), item);
        }
        containers.push({ assetId, label, expected, read: contents.length, error: null });
        enumerated.add(assetId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        report(`storage unit ${label} failed: ${message}`);
        containers.push({ assetId, label, expected, read: 0, error: message });
      }

      if (index < caskets.length - 1) {
        await sleep(gc.casketDelayMs);
      }
    }

    report('resolving item names');
    const resolved = [...raw.values()].map((item) => catalog.resolve(normalizeEconItem(item)));

    const seenAt = new Date().toISOString();
    const current = toPlacements(resolved);

    // Only consider an item gone if we actually looked where it used to be.
    // A storage unit we failed to read must not produce thousands of bogus
    // "removed" events.
    const previous = new Map(
      [...livePlacements(db)].filter(
        ([, placement]) => placement.containerId === null || enumerated.has(placement.containerId),
      ),
    );

    const diff = diffPlacements(previous, current);

    upsertItems(db, resolved, seenAt);
    markRemoved(db, diff.removed.map((change) => change.assetId), seenAt);
    recordEvents(db, runId, seenAt, diff);

    const unresolved = resolved.filter((item) => !item.resolved).length;
    const looseItems = resolved.filter((item) => item.containerId === null).length;

    finishSyncRun(db, runId, seenAt, {
      totalItems: resolved.length,
      containers: containers.length,
      added: diff.added.length,
      removed: diff.removed.length,
      moved: diff.moved.length,
      unresolved,
    });

    return {
      runId,
      steamId,
      totalItems: resolved.length,
      looseItems,
      containers,
      failedContainers: containers.filter((c) => c.error !== null).length,
      unresolved,
      diff,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failSyncRun(db, runId, new Date().toISOString(), message);
    throw error;
  }
}
