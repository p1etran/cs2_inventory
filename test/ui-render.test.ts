// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { ContainerRow, EventRow, StackRow, Stats, StoredItem } from '../extension/src/store.js';
import { DEVICE_NAME } from '../extension/src/steam/auth.js';
import {
  emptyMessage,
  eventRow,
  itemRow,
  locationLabel,
  portfolioRows,
  qrPanel,
  renderContainers,
  renderStats,
  stackRow,
} from '../extension/src/ui/render.js';

/**
 * Rendering the index.
 *
 * Two things here are worth more than the rest: a storage unit whose read was
 * interrupted must be visibly short rather than quietly plausible, and an item
 * name is whatever a player typed into a name tag, so it must never be able to
 * become markup.
 */

const labels = new Map([
  ['100', 'cases - p1'],
  ['200', 'czarna dziura'],
]);

function storedItem(overrides: Partial<StoredItem> = {}): StoredItem {
  return {
    assetId: '1',
    defIndex: 7,
    paintIndex: 44,
    paintSeed: 100,
    floatValue: 0.2036,
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
    searchText: 'ak 47 redline field tested',
    firstSeen: '2026-01-01T00:00:00.000Z',
    lastSeen: '2026-01-01T00:00:00.000Z',
    removedAt: null,
    ...overrides,
  } as StoredItem;
}

describe('item rows', () => {
  it('shows the name, float and where it lives', () => {
    const row = itemRow(storedItem({ containerId: '100' }), labels);

    expect(row.querySelector('.title')?.textContent).toContain('AK-47 | Redline (Field-Tested)');
    expect(row.querySelector('.float')?.textContent).toBe('0.203600');
    expect(row.querySelector('.where')?.textContent).toBe('cases - p1');
  });

  it('says "inventory" for a loose item rather than showing nothing', () => {
    const row = itemRow(storedItem({ containerId: null }), labels);
    expect(row.querySelector('.where')?.textContent).toBe('inventory');
    expect(row.querySelector('.where')?.className).toContain('loose');
  });

  it('falls back to the id for a unit it has no label for', () => {
    // Can happen when a unit was read but its own row has not been stored yet.
    expect(locationLabel('999', labels)).toBe('unit 999');
  });

  it('leaves the float blank rather than printing a zero', () => {
    // A sticker has no float; 0.000000 would read as a Factory New one.
    expect(itemRow(storedItem({ floatValue: null }), labels).querySelector('.float')?.textContent).toBe('');
  });

  it('badges StatTrak and a name tag', () => {
    const row = itemRow(storedItem({ stattrak: true, customName: 'my gun' }), labels);
    const badges = [...row.querySelectorAll('.badge')].map((b) => b.textContent);
    expect(badges).toEqual(['ST', '"my gun"']);
  });

  it('does not badge a storage unit with its own label', () => {
    // The unit's name is already its row title; repeating it as a tag is noise.
    const row = itemRow(storedItem({ isContainer: true, customName: 'cases - p1' }), labels);
    expect(row.querySelectorAll('.badge')).toHaveLength(0);
  });

  it('treats a name tag as text, never as markup', () => {
    // A name tag is whatever a player typed, and players type anything.
    const row = itemRow(storedItem({ customName: '<img src=x onerror=alert(1)>' }), labels);

    expect(row.querySelector('img')).toBeNull();
    expect(row.querySelector('.badge')?.textContent).toBe('"<img src=x onerror=alert(1)>"');
  });

  it('renders no image element when there is no art', () => {
    expect(itemRow(storedItem({ imageUrl: null }), labels).querySelector('img')).toBeNull();
  });

  it('removes art that fails to load rather than leaving a broken icon', () => {
    const row = itemRow(storedItem({ imageUrl: 'https://example.invalid/x.png' }), labels);
    const img = row.querySelector('img');
    expect(img).not.toBeNull();

    img?.dispatchEvent(new Event('error'));
    expect(row.querySelector('img')).toBeNull();
  });
});

describe('the storage unit list', () => {
  const containers: ContainerRow[] = [
    { assetId: '100', label: 'cases - p1', containedCount: 818, storedCount: 818, value: null },
    { assetId: '200', label: 'czarna dziura', containedCount: 981, storedCount: 400, value: null },
  ];

  it('shows both counts for every unit', () => {
    const rows = renderContainers({ containers, selected: null, onSelect: () => {} });
    const counts = rows.slice(1).map((row) => row.querySelector('.count')?.textContent);
    expect(counts).toEqual(['818/818', '400/981']);
  });

  it('marks a unit that is short, and says why on hover', () => {
    const rows = renderContainers({ containers, selected: null, onSelect: () => {} });

    // The whole reason both counts are shown: a partial read must not look
    // like a complete unit.
    expect(rows[1]?.querySelector('.count')?.className).not.toContain('short');
    const short = rows[2]?.querySelector('.count');
    expect(short?.className).toContain('short');
    expect(short?.getAttribute('title')).toMatch(/not been read/);
  });

  it('offers "Everything" first, and marks it active when nothing is picked', () => {
    const rows = renderContainers({ containers, selected: null, onSelect: () => {} });
    expect(rows[0]?.textContent).toBe('Everything');
    expect(rows[0]?.querySelector('button')?.className).toContain('is-active');
  });

  it('marks the selected unit instead', () => {
    const rows = renderContainers({ containers, selected: '200', onSelect: () => {} });
    expect(rows[0]?.querySelector('button')?.className).not.toContain('is-active');
    expect(rows[2]?.querySelector('button')?.className).toContain('is-active');
  });

  it('selects a unit, and deselects the one already selected', () => {
    const picked: (string | null)[] = [];
    const rows = renderContainers({
      containers,
      selected: '100',
      onSelect: (assetId) => picked.push(assetId),
    });

    rows[1]?.querySelector('button')?.click();
    rows[2]?.querySelector('button')?.click();
    // Clicking the active unit clears the filter; clicking another switches.
    expect(picked).toEqual([null, '200']);
  });

  it('treats a unit label as text', () => {
    const rows = renderContainers({
      containers: [{ assetId: '1', label: '<b>bold</b>', containedCount: 0, storedCount: 0, value: null }],
      selected: null,
      onSelect: () => {},
    });
    expect(rows[1]?.querySelector('b')).toBeNull();
    expect(rows[1]?.textContent).toContain('<b>bold</b>');
  });
});

describe('stats', () => {
  const stats: Stats = {
    totalItems: 16167,
    looseItems: 997,
    storedItems: 15170,
    distinctNames: 1200,
    containers: 22,
    unresolved: 0,
    stattrak: 14,
    souvenir: 3,
    lastSync: '2026-09-12T19:00:00.000Z',
  };

  it('groups the thousands, because these numbers are large', () => {
    const tiles = renderStats(stats);
    expect(tiles[0]?.querySelector('b')?.textContent).toBe((16167).toLocaleString());
  });

  it('hides the unnamed count when there is nothing to report', () => {
    const labelsShown = renderStats(stats).map((tile) => tile.querySelector('span')?.textContent);
    expect(labelsShown).not.toContain('Unnamed');
  });

  it('shows it when items could not be named', () => {
    const labelsShown = renderStats({ ...stats, unresolved: 4 }).map(
      (tile) => tile.querySelector('span')?.textContent,
    );
    expect(labelsShown).toContain('Unnamed');
  });

  it('says "never" rather than an empty date before the first sync', () => {
    const tiles = renderStats({ ...stats, lastSync: null });
    expect(tiles.at(-1)?.textContent).toContain('Last sync: never');
  });
});

describe('grouped rows', () => {
  const stack: StackRow = {
    marketHashName: 'Antwerp 2022 Contenders Sticker Capsule',
    count: 1000,
    locations: 3,
    category: 'Container',
    rarityName: 'Base Grade',
    rarityColor: '#b0c3d9',
    imageUrl: null,
  };

  it('shows the count and how many places they are spread across', () => {
    const row = stackRow(stack, () => {});
    expect(row.querySelector('.float')?.textContent).toBe('x1000');
    expect(row.querySelector('.sub')?.textContent).toBe('across 3 locations');
  });

  it('says "location" when there is only one', () => {
    expect(stackRow({ ...stack, locations: 1 }, () => {}).querySelector('.sub')?.textContent).toBe(
      'across 1 location',
    );
  });

  it('drills into the items behind a group when clicked', () => {
    const picked = vi.fn();
    stackRow(stack, picked).click();
    expect(picked).toHaveBeenCalledWith('Antwerp 2022 Contenders Sticker Capsule');
  });
});

describe('change rows', () => {
  const base: EventRow = {
    at: '2026-09-12T19:00:00.000Z',
    kind: 'added',
    assetId: '1',
    marketHashName: 'AK-47 | Redline (Field-Tested)',
    fromContainer: null,
    toContainer: null,
  };

  it('shows where something arrived', () => {
    const row = eventRow({ ...base, kind: 'added', toContainer: '100' }, labels);
    expect(row.querySelector('.sub')?.textContent).toBe('cases - p1');
    expect(row.querySelector('.float')?.textContent).toBe('added');
  });

  it('shows where something went', () => {
    const row = eventRow({ ...base, kind: 'removed', fromContainer: '200' }, labels);
    expect(row.querySelector('.sub')?.textContent).toBe('czarna dziura');
  });

  it('shows both ends of a move', () => {
    const row = eventRow({ ...base, kind: 'moved', fromContainer: '100', toContainer: '200' }, labels);
    expect(row.querySelector('.sub')?.textContent).toBe('cases - p1 → czarna dziura');
  });

  it('falls back to the asset id when the name was never known', () => {
    const row = eventRow({ ...base, marketHashName: '' }, labels);
    expect(row.querySelector('.title')?.textContent).toBe('1');
  });
});

describe('money on a row', () => {
  const money = { prices: { 'AK-47 | Redline (Field-Tested)': 1055 }, currency: 'USD' };

  it('shows nothing at all when prices are not loaded', () => {
    expect(itemRow(storedItem(), labels).querySelector('.money')).toBeNull();
  });

  it('shows the price when it has one', () => {
    const row = itemRow(storedItem(), labels, money);
    expect(row.querySelector('.money')?.textContent).toMatch(/10\.55/);
  });

  it('shows a dash, not a zero, for an item with no price', () => {
    // An item with no market listing is unpriced, not worthless, and the two
    // must never look the same on a row someone is scanning for value.
    const row = itemRow(storedItem({ marketHashName: 'Souvenir nobody trades' }), labels, money);
    expect(row.querySelector('.money')?.textContent).toBe('—');
    expect(row.querySelector('.money')?.className).toContain('none');
  });
});

describe('unit values', () => {
  const containers: ContainerRow[] = [
    { assetId: '100', label: 'full', containedCount: 10, storedCount: 10, value: 50_000 },
    { assetId: '200', label: 'short', containedCount: 100, storedCount: 40, value: 20_000 },
  ];

  it('shows nothing when prices are not loaded', () => {
    const rows = renderContainers({
      containers: containers.map((c) => ({ ...c, value: null })),
      selected: null,
      onSelect: () => {},
    });
    expect(rows[1]?.querySelector('.unit-value')).toBeNull();
  });

  it('shows what a fully read unit holds', () => {
    const rows = renderContainers({ containers, selected: null, onSelect: () => {}, currency: 'USD' });
    expect(rows[1]?.querySelector('.unit-value')?.textContent).toMatch(/^\$?500\.00/);
  });

  it('marks a short unit as at-least, because the rest is not counted', () => {
    const rows = renderContainers({ containers, selected: null, onSelect: () => {}, currency: 'USD' });
    const value = rows[2]?.querySelector('.unit-value');

    // 40 of 100 items are priced into this figure. Presenting it as the
    // unit's worth would understate it by more than half.
    expect(value?.textContent).toMatch(/^≥/);
    expect(value?.getAttribute('title')).toMatch(/not been read/);
  });
});

describe('the portfolio', () => {
  const run = (at: string, value: number | undefined, totalItems = 16_167) => ({
    at,
    steamId: '765',
    totalItems,
    containers: 22,
    added: 0,
    removed: 0,
    moved: 0,
    unresolved: 0,
    failedContainers: 0,
    ...(value === undefined ? {} : { value, currency: 'USD' }),
  });

  it('says what to do when nothing has been valued yet', () => {
    const { rows, empty } = portfolioRows([run('2026-09-12T19:00:00Z', undefined)], 'USD');
    expect(rows).toEqual([]);
    expect(empty).toMatch(/Load prices/);
  });

  it('skips runs made before prices were loaded', () => {
    // A run with no value is not a run worth zero, and charting it as zero
    // would put a cliff in the history.
    const { rows } = portfolioRows(
      [run('2026-09-12T19:00:00Z', 168_800), run('2026-09-11T19:00:00Z', undefined)],
      'USD',
    );
    expect(rows).toHaveLength(1);
  });

  it('shows the change since the previous valued sync, with its sign', () => {
    const { rows } = portfolioRows(
      [run('2026-09-12T19:00:00Z', 170_000), run('2026-09-11T19:00:00Z', 168_800)],
      'USD',
    );

    expect(rows[0]?.querySelector('.float')?.textContent).toMatch(/^\+/);
    expect(rows[0]?.querySelector('.float')?.className).toContain('up');
    // The oldest row has nothing to compare against.
    expect(rows[1]?.querySelector('.float')?.textContent).toBe('');
  });

  it('marks a fall as a fall', () => {
    const { rows } = portfolioRows(
      [run('2026-09-12T19:00:00Z', 160_000), run('2026-09-11T19:00:00Z', 168_800)],
      'USD',
    );
    expect(rows[0]?.querySelector('.float')?.textContent).toMatch(/^-/);
    expect(rows[0]?.querySelector('.float')?.className).toContain('down');
  });

  it('uses the currency the run was valued in, not today\'s', () => {
    // Switching source or currency later must not relabel old figures.
    const older = { ...run('2026-09-11T19:00:00Z', 100_000), currency: 'EUR' };
    const { rows } = portfolioRows([older], 'USD');
    expect(rows[0]?.querySelector('.title')?.textContent).toMatch(/€|EUR/);
  });
});

describe('the empty state', () => {
  it('tells a new user what to press', () => {
    expect(emptyMessage({ hasIndex: false, hasQuery: false })).toMatch(/Press "Sync"/);
    // Even with something typed: an empty index is the thing to fix first.
    expect(emptyMessage({ hasIndex: false, hasQuery: true })).toMatch(/Press "Sync"/);
  });

  it('distinguishes an empty index from an unmatched search', () => {
    expect(emptyMessage({ hasIndex: true, hasQuery: true })).toMatch(/Nothing matches/);
    expect(emptyMessage({ hasIndex: true, hasQuery: false })).toBe('Nothing here.');
  });
});

/**
 * The sign-in panel makes promises about what happens to the user's account.
 * Each one is checked here, because the cost of a claim drifting away from
 * what the code does is not a rendering bug -- it is a lie on the one screen
 * where the user is deciding whether to trust this at all.
 */
describe('the sign-in panel', () => {
  const render = () => {
    const host = document.createElement('div');
    host.append(...qrPanel(document.createElement('svg'), DEVICE_NAME));
    return host;
  };

  it('frames it as authorizing a device, not signing in to us', () => {
    const text = render().textContent ?? '';
    expect(text).toContain('Authorize this browser');
    expect(text).toContain('not a sign-in to CS2 Inventory');
  });

  it('names the device exactly as auth.ts registers it, so it can be found and revoked', () => {
    expect(render().querySelector('.note b')?.textContent).toBe(DEVICE_NAME);
    expect(render().textContent).toContain('revoke it at any time');
  });

  it('names the relay scam rather than leaving the user to wonder', () => {
    const disclosure = render().querySelector('details');
    expect(disclosure?.querySelector('summary')?.textContent).toContain(
      'How do I know this code is really mine?',
    );
    const answer = disclosure?.textContent ?? '';
    expect(answer).toContain("someone else's session");
    // Pointing at something checkable is the only answer that is worth
    // anything here: reassurance from the page under suspicion proves nothing.
    expect(answer).toContain('Network tab');
  });

  it('shows the QR it was handed', () => {
    expect(render().querySelector('#qr')?.firstChild).not.toBeNull();
  });
});
