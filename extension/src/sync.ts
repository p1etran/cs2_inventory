import { diffPlacements, normalizeEconItem, type Catalog, type ResolvedItem } from '../../src/core.js';
import type { GcClient, GcEconItem } from './steam/gc.js';
import { Store, type SyncRun } from './store.js';

/**
 * Reads the whole account: the loose inventory plus every storage unit.
 *
 * Ported from `src/sync/sync.ts`, which has done this against a real account
 * for a while. Two rules there matter more than the rest and are the reason
 * this is a port rather than a rewrite:
 *
 *  - Reads are spaced and backed off, because the coordinator rate-limits and
 *    a burst makes it worse rather than faster.
 *  - **A unit that fails to read leaves its stored items untouched.** Anything
 *    else reports thousands of items as removed because a single read timed
 *    out, and a change log that cries wolf is worse than none.
 */

/** Spacing between unit reads, as the Node client uses. */
const READ_DELAY_MS = 1100;
const READ_ATTEMPTS = 3;

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
  totalItems: number;
  looseItems: number;
  containers: ContainerReport[];
  failedContainers: number;
  unresolved: number;
  added: number;
  removed: number;
  moved: number;
}

export interface SyncOptions {
  gc: GcClient;
  store: Store;
  catalog: Catalog;
  steamId: string;
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
  /** Overridable so tests do not wait eleven seconds per run. */
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runSync(options: SyncOptions): Promise<SyncSummary> {
  const { gc, store, catalog, steamId } = options;
  const report = options.onProgress ?? (() => {});
  const delayMs = options.delayMs ?? READ_DELAY_MS;
  const sleep = options.sleep ?? wait;

  // Asset ids are unique, so a map also dedupes the overlap between the base
  // inventory and any unit the coordinator decided to send unprompted.
  const raw = new Map<string, GcEconItem>();
  for (const item of gc.items) {
    if (item.id) raw.set(item.id, item);
  }

  const units = gc.storageUnits.map((unit) => ({ raw: unit, ...normalizeEconItem(unit) }));
  report(`${raw.size} items in the inventory, ${units.length} storage units`);

  const containers: ContainerReport[] = [];
  /** Units we actually looked inside. Only these may produce removals. */
  const enumerated = new Set<string>();

  for (const [index, unit] of units.entries()) {
    if (options.signal?.aborted) throw new Error('Sync cancelled');

    const expected = unit.containedCount ?? 0;
    const label = unit.customName || 'Storage Unit';

    if (expected === 0) {
      // Nothing to ask for, and an empty unit is still fully enumerated.
      containers.push({ assetId: unit.assetId, label, expected: 0, read: 0, error: null });
      enumerated.add(unit.assetId);
      continue;
    }

    report(`Reading ${index + 1}/${units.length}: ${label} (${expected} items)`);
    try {
      await readUnit(gc, unit.assetId, { attempts: READ_ATTEMPTS, delayMs, sleep, report, label });
      for (const item of gc.itemsIn(unit.assetId)) {
        if (item.id) raw.set(item.id, item);
      }
      const read = gc.itemsIn(unit.assetId).length;
      containers.push({ assetId: unit.assetId, label, expected, read, error: null });
      enumerated.add(unit.assetId);
      if (read < expected) report(`  read ${read} of ${expected}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report(`  ${label} failed: ${message}`);
      containers.push({ assetId: unit.assetId, label, expected, read: 0, error: message });
    }

    if (index < units.length - 1) await sleep(delayMs);
  }

  report('Resolving item names');
  const resolved: ResolvedItem[] = [...raw.values()].map((item) =>
    catalog.resolve(normalizeEconItem(item)),
  );

  const seenAt = new Date().toISOString();
  const current = new Map(
    resolved.map((item) => [
      item.assetId,
      { containerId: item.containerId, marketHashName: item.marketHashName },
    ]),
  );

  /*
   * Only items we could have seen are eligible to be reported missing: loose
   * ones, and ones in a unit this run actually read. A unit that failed keeps
   * everything it had.
   */
  const previous = new Map(
    [...store.livePlacements()].filter(
      ([, placement]) => placement.containerId === null || enumerated.has(placement.containerId),
    ),
  );

  const diff = diffPlacements(previous, current);
  store.applySync(resolved, diff, seenAt);

  const unresolved = resolved.filter((item) => !item.resolved).length;
  const failedContainers = containers.filter((container) => container.error !== null).length;

  const run: SyncRun = {
    at: seenAt,
    steamId,
    totalItems: resolved.length,
    containers: containers.length,
    added: diff.added.length,
    removed: diff.removed.length,
    moved: diff.moved.length,
    unresolved,
    failedContainers,
  };
  store.recordRun(run);
  await store.save();

  return {
    totalItems: resolved.length,
    looseItems: resolved.filter((item) => item.containerId === null).length,
    containers,
    failedContainers,
    unresolved,
    added: diff.added.length,
    removed: diff.removed.length,
    moved: diff.moved.length,
  };
}

/**
 * Reads one unit, retrying the timeouts the coordinator hands out when busy.
 *
 * Each attempt backs off further, because retrying hard against a rate limit
 * is how a slow sync becomes a failed one.
 */
async function readUnit(
  gc: GcClient,
  assetId: string,
  options: {
    attempts: number;
    delayMs: number;
    sleep: (ms: number) => Promise<void>;
    report: (message: string) => void;
    label: string;
  },
): Promise<void> {
  let lastError: Error = new Error(`Could not read ${options.label}`);

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      await gc.loadStorageUnit(assetId);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < options.attempts) {
        const backoff = options.delayMs * 2 ** attempt;
        options.report(
          `  ${options.label}: ${lastError.message}; retrying in ${Math.round(backoff / 100) / 10}s`,
        );
        await options.sleep(backoff);
      }
    }
  }
  throw lastError;
}
