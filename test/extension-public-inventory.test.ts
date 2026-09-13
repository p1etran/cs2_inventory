import { describe, expect, it } from 'vitest';
import {
  parseInventoryPage,
  PublicInventoryError,
  readPublicInventory,
  summarize,
} from '../extension/src/steam/publicinventory.js';

/**
 * The public inventory, which is what a new user sees before signing in.
 *
 * Its shape is nothing like the game coordinator's: items arrive as assets
 * pointing at shared descriptions, a storage unit is identified by its name
 * rather than a def_index, its item count is prose inside a description line,
 * and its label arrives as a name tag wrapped in a fraud warning. Every one of
 * those is a place to get it quietly wrong, which is why the parsing is pure
 * and tested rather than only exercised through the network.
 */

const description = (over: Record<string, unknown> = {}) => ({
  classid: '1',
  instanceid: '0',
  market_hash_name: 'AK-47 | Redline (Field-Tested)',
  name: 'AK-47 | Redline',
  icon_url: 'abc123',
  name_color: 'd32ce6',
  tags: [
    { category: 'Rarity', localized_tag_name: 'Classified' },
    { category: 'Type', localized_tag_name: 'Rifle' },
  ],
  ...over,
});

const unitDescription = (label: string | null, count: number, over = {}) =>
  description({
    classid: '9',
    market_hash_name: 'Storage Unit',
    name: 'Storage Unit',
    tags: [{ category: 'Type', localized_tag_name: 'Tool' }],
    descriptions: [{ value: `Number of Items: ${count}` }],
    ...(label === null ? {} : { fraudwarnings: [`Name Tag: ''${label}''`] }),
    ...over,
  });

const page = (assets: unknown[], descriptions: unknown[], more = false, last: string | null = null) => ({
  success: 1,
  assets,
  descriptions,
  ...(more ? { more_items: 1, last_assetid: last } : {}),
});

const asset = (assetid: string, classid = '1', amount = '1', instanceid = '0') => ({
  assetid,
  classid,
  instanceid,
  amount,
});

describe('reading a page', () => {
  it('refuses a reply Steam did not mark successful', () => {
    expect(() => parseInventoryPage({ success: 0, error: 'This profile is private.' })).toThrow(
      /private/,
    );
    expect(() => parseInventoryPage({})).toThrow(PublicInventoryError);
  });

  it('says something usable when Steam gives no reason', () => {
    expect(() => parseInventoryPage({ success: 0 })).toThrow(/private, or Steam may be busy/);
  });

  it('keys descriptions by class and instance together', () => {
    // Two items can share a classid and differ only by instanceid -- a name
    // tag is exactly that -- so keying on classid alone merges them.
    const parsed = parseInventoryPage(
      page(
        [],
        [
          description({ classid: '1', instanceid: '0', market_hash_name: 'plain' }),
          description({ classid: '1', instanceid: '77', market_hash_name: 'named' }),
        ],
      ),
    );
    expect(parsed.descriptions.get('1_0')?.market_hash_name).toBe('plain');
    expect(parsed.descriptions.get('1_77')?.market_hash_name).toBe('named');
  });

  it('reports whether there is more to fetch', () => {
    expect(parseInventoryPage(page([], [], true, '999'))).toMatchObject({
      more: true,
      lastAssetId: '999',
    });
    expect(parseInventoryPage(page([], []))).toMatchObject({ more: false, lastAssetId: null });
  });
});

describe('summarising an inventory', () => {
  it('groups loose items by name, most numerous first', () => {
    const parsed = parseInventoryPage(
      page(
        [asset('1'), asset('2'), asset('3', '2')],
        [description(), description({ classid: '2', market_hash_name: 'AWP | Asiimov (Well-Worn)' })],
      ),
    );

    const preview = summarize([parsed]);
    expect(preview.items.map((i) => [i.marketHashName, i.count])).toEqual([
      ['AK-47 | Redline (Field-Tested)', 2],
      ['AWP | Asiimov (Well-Worn)', 1],
    ]);
    expect(preview.looseCount).toBe(3);
  });

  it('reads a storage unit label out of its name tag', () => {
    const parsed = parseInventoryPage(page([asset('1', '9')], [unitDescription('cases - p1', 818)]));

    const preview = summarize([parsed]);
    expect(preview.units).toEqual([{ label: 'cases - p1', containedCount: 818 }]);
    // A unit is never a "loose item" in the grouped list; it is a unit.
    expect(preview.items).toEqual([]);
  });

  it('reads a label containing quotes', () => {
    // Steam wraps the tag in doubled single quotes, and a label may contain
    // them, so the closing pair has to be matched at the end.
    const parsed = parseInventoryPage(
      page([asset('1', '9')], [unitDescription("it's ''mine''", 5)]),
    );
    expect(preview_of(parsed).units[0]?.label).toBe("it's ''mine''");
  });

  it('falls back to "Storage Unit" for one with no name tag', () => {
    const parsed = parseInventoryPage(page([asset('1', '9')], [unitDescription(null, 3)]));
    expect(preview_of(parsed).units[0]?.label).toBe('Storage Unit');
  });

  it('counts what is inside units separately from what is loose', () => {
    const parsed = parseInventoryPage(
      page(
        [asset('1'), asset('2', '9'), asset('3', '9', '1', '5')],
        [
          description(),
          unitDescription('one', 818),
          // Same class, different instance -- which is exactly how a name tag
          // makes two otherwise identical items distinct.
          { ...unitDescription('two', 981), instanceid: '5' },
        ],
      ),
    );

    const preview = summarize([parsed]);
    expect(preview.units.map((u) => u.label)).toEqual(['one', 'two']);
    expect(preview.storedCount).toBe(818 + 981);
    // The units themselves are items too, so three assets means three loose.
    expect(preview.looseCount).toBe(3);
  });

  it('reports zero for a unit whose count Steam did not include', () => {
    const parsed = parseInventoryPage(
      page([asset('1', '9')], [{ ...unitDescription('empty', 0), descriptions: [] }]),
    );
    expect(preview_of(parsed).units[0]?.containedCount).toBe(0);
  });

  it('carries the art, rarity and type through', () => {
    const parsed = parseInventoryPage(page([asset('1')], [description()]));
    expect(preview_of(parsed).items[0]).toMatchObject({
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/abc123',
      rarityName: 'Classified',
      rarityColor: '#d32ce6',
      category: 'Rifle',
    });
  });

  it('copes with an item that has no art', () => {
    const parsed = parseInventoryPage(
      page([asset('1')], [{ ...description(), icon_url: undefined, name_color: undefined }]),
    );
    expect(preview_of(parsed).items[0]).toMatchObject({ imageUrl: null, rarityColor: null });
  });

  it('skips an asset whose description is missing rather than inventing one', () => {
    const parsed = parseInventoryPage(page([asset('1'), asset('2', '404')], [description()]));
    expect(preview_of(parsed).looseCount).toBe(1);
  });

  it('respects a stack amount above one', () => {
    const parsed = parseInventoryPage(page([asset('1', '1', '5')], [description()]));
    expect(preview_of(parsed).items[0]?.count).toBe(5);
    expect(preview_of(parsed).looseCount).toBe(5);
  });
});

function preview_of(parsed: ReturnType<typeof parseInventoryPage>) {
  return summarize([parsed]);
}

describe('fetching', () => {
  it('follows paging until Steam says there is no more', async () => {
    const urls: string[] = [];
    const fetcher = (url: string) => {
      urls.push(url);
      return Promise.resolve(
        urls.length === 1
          ? page([asset('1')], [description()], true, '1')
          : page([asset('2')], [description()]),
      );
    };

    const preview = await readPublicInventory('765', fetcher);
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain('start_assetid=1');
    expect(preview.looseCount).toBe(2);
  });

  it('stops rather than paging forever', async () => {
    let calls = 0;
    const fetcher = () => {
      calls += 1;
      return Promise.resolve(page([asset(String(calls))], [description()], true, String(calls)));
    };

    await readPublicInventory('765', fetcher);
    // This is a preview, not the index; an account that pages past this is one
    // the sync is for.
    expect(calls).toBe(3);
  });

  it('asks for the right account, in English', async () => {
    let seen = '';
    await readPublicInventory('76561198061412334', (url) => {
      seen = url;
      return Promise.resolve(page([], []));
    });

    expect(seen).toContain('/inventory/76561198061412334/730/2');
    // Rarity and type names are read off the tags, so the language matters.
    expect(seen).toContain('l=english');
  });
});
