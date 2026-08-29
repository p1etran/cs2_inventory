export interface Placement {
  /** Storage unit asset id, or null when the item sits loose in the inventory. */
  containerId: string | null;
  marketHashName: string;
}

export interface AddedChange {
  assetId: string;
  marketHashName: string;
  toContainer: string | null;
}

export interface RemovedChange {
  assetId: string;
  marketHashName: string;
  fromContainer: string | null;
}

export interface MovedChange {
  assetId: string;
  marketHashName: string;
  fromContainer: string | null;
  toContainer: string | null;
}

export interface InventoryDiff {
  added: AddedChange[];
  removed: RemovedChange[];
  moved: MovedChange[];
}

/**
 * Compares two inventory snapshots keyed by asset id.
 *
 * Asset ids are stable while an item stays in the account, including when it
 * is moved into or out of a storage unit, so a changed container for a known
 * id is a move rather than a delete plus an add.
 */
export function diffPlacements(
  previous: ReadonlyMap<string, Placement>,
  current: ReadonlyMap<string, Placement>,
): InventoryDiff {
  const diff: InventoryDiff = { added: [], removed: [], moved: [] };

  for (const [assetId, now] of current) {
    const before = previous.get(assetId);
    if (!before) {
      diff.added.push({
        assetId,
        marketHashName: now.marketHashName,
        toContainer: now.containerId,
      });
    } else if (before.containerId !== now.containerId) {
      diff.moved.push({
        assetId,
        marketHashName: now.marketHashName,
        fromContainer: before.containerId,
        toContainer: now.containerId,
      });
    }
  }

  for (const [assetId, before] of previous) {
    if (!current.has(assetId)) {
      diff.removed.push({
        assetId,
        marketHashName: before.marketHashName,
        fromContainer: before.containerId,
      });
    }
  }

  return diff;
}
