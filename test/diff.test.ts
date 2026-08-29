import { describe, expect, it } from 'vitest';
import { diffPlacements, type Placement } from '../src/domain/diff.js';

const at = (containerId: string | null, name = 'AK-47 | Redline (Field-Tested)'): Placement => ({
  containerId,
  marketHashName: name,
});

describe('diffPlacements', () => {
  it('reports nothing when both snapshots match', () => {
    const snapshot = new Map([['1', at(null)], ['2', at('c1')]]);
    const diff = diffPlacements(snapshot, new Map(snapshot));
    expect(diff).toEqual({ added: [], removed: [], moved: [] });
  });

  it('detects a new item', () => {
    const diff = diffPlacements(new Map(), new Map([['1', at('c1')]]));
    expect(diff.added).toEqual([
      { assetId: '1', marketHashName: 'AK-47 | Redline (Field-Tested)', toContainer: 'c1' },
    ]);
    expect(diff.removed).toHaveLength(0);
  });

  it('detects an item that left the account', () => {
    const diff = diffPlacements(new Map([['1', at('c1')]]), new Map());
    expect(diff.removed).toEqual([
      { assetId: '1', marketHashName: 'AK-47 | Redline (Field-Tested)', fromContainer: 'c1' },
    ]);
  });

  it('treats a changed container as a move, not a delete plus an add', () => {
    const diff = diffPlacements(new Map([['1', at('c1')]]), new Map([['1', at('c2')]]));
    expect(diff.moved).toEqual([
      {
        assetId: '1',
        marketHashName: 'AK-47 | Redline (Field-Tested)',
        fromContainer: 'c1',
        toContainer: 'c2',
      },
    ]);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('tracks items pulled out of a unit into the loose inventory', () => {
    const diff = diffPlacements(new Map([['1', at('c1')]]), new Map([['1', at(null)]]));
    expect(diff.moved[0]).toMatchObject({ fromContainer: 'c1', toContainer: null });
  });
});
