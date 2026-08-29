import { describe, expect, it } from 'vitest';
import { buildCatalogIndex } from '../src/catalog/build.js';
import { Catalog } from '../src/catalog/catalog.js';
import { emptyCatalogIndex, type CatalogIndex } from '../src/catalog/types.js';
import { DEF, QUALITY } from '../src/domain/attributes.js';
import { normalizeEconItem } from '../src/domain/econ.js';
import { econItem } from './helpers.js';

function fixtureIndex(): CatalogIndex {
  const index = emptyCatalogIndex();
  index.skins['7:44'] = { name: 'AK-47 | Case Hardened', rarity: 'Classified', rarityColor: '#d32ce6' };
  index.skins['507:38'] = { name: '★ Karambit | Fade', rarity: 'Covert' };
  index.weapons['507'] = { name: 'Karambit', star: true };
  index.weapons['7'] = { name: 'AK-47', star: false };
  index.byDef['4288'] = { name: 'Glove Case', rarity: 'Base Grade' };
  index.stickers['1'] = { name: 'Sticker | Titan (Holo) | Katowice 2014' };
  index.graffiti['1653'] = { name: 'Sealed Graffiti | Blood Boiler' };
  index.patches['4550'] = { name: 'Patch | Crazy Banana' };
  index.keychains['1'] = { name: "Charm | Lil' Ava" };
  index.highlights['1'] = { name: 'Souvenir Charm | Austin 2025 Highlight | chopper Double Kill' };
  index.musicKits['1'] = { name: 'Valve, Counter-Strike 2' };
  return index;
}

const catalog = new Catalog(fixtureIndex());
const resolve = (fixture: Parameters<typeof econItem>[0]) =>
  catalog.resolve(normalizeEconItem(econItem(fixture)));

describe('Catalog.resolve', () => {
  it('names a painted weapon with its exterior', () => {
    const item = resolve({ id: '1', defIndex: 7, paintIndex: 44, wear: 0.24 });
    expect(item.marketHashName).toBe('AK-47 | Case Hardened (Field-Tested)');
    expect(item.rarityName).toBe('Classified');
    expect(item.resolved).toBe(true);
  });

  it('names a StatTrak knife with the star in the right place', () => {
    const item = resolve({
      id: '2',
      defIndex: 507,
      paintIndex: 38,
      wear: 0.02,
      quality: QUALITY.STRANGE,
    });
    expect(item.marketHashName).toBe('★ StatTrak™ Karambit | Fade (Factory New)');
  });

  it('names a vanilla knife from the weapon table', () => {
    const item = resolve({ id: '3', defIndex: 507, paintIndex: 0 });
    expect(item.marketHashName).toBe('★ Karambit');
    expect(item.wearName).toBeNull();
  });

  it('names a case by its own definition index', () => {
    expect(resolve({ id: '4', defIndex: 4288 }).marketHashName).toBe('Glove Case');
  });

  it('names a sticker from the sticker kit in slot zero', () => {
    const item = resolve({ id: '5', defIndex: DEF.STICKER, stickerIds: [1] });
    expect(item.marketHashName).toBe('Sticker | Titan (Holo) | Katowice 2014');
  });

  it('appends the tint to a sealed graffiti', () => {
    const item = resolve({ id: '6', defIndex: DEF.GRAFFITI_SEALED, stickerIds: [1653], tintId: 6 });
    expect(item.marketHashName).toBe('Sealed Graffiti | Blood Boiler (Tracer Yellow)');
  });

  it('leaves the tint off when the id is unknown', () => {
    const item = resolve({ id: '7', defIndex: DEF.GRAFFITI_SEALED, stickerIds: [1653], tintId: 999 });
    expect(item.marketHashName).toBe('Sealed Graffiti | Blood Boiler');
  });

  it('names a patch from the same slot stickers use', () => {
    expect(resolve({ id: '8', defIndex: DEF.PATCH, stickerIds: [4550] }).marketHashName).toBe(
      'Patch | Crazy Banana',
    );
  });

  it('names a charm from the keychain id', () => {
    expect(resolve({ id: '9', defIndex: DEF.KEYCHAIN, keychainId: 1 }).marketHashName).toBe(
      "Charm | Lil' Ava",
    );
  });

  it('prefers the highlight table when a charm carries a highlight id', () => {
    // Charm id 1 and highlight id 1 are different items; the attribute decides.
    const item = resolve({ id: '10', defIndex: DEF.KEYCHAIN, keychainId: 1, highlightId: 1 });
    expect(item.marketHashName).toBe(
      'Souvenir Charm | Austin 2025 Highlight | chopper Double Kill',
    );
  });

  it('adds the Music Kit prefix and StatTrak variant', () => {
    expect(resolve({ id: '11', defIndex: DEF.MUSIC_KIT, musicId: 1 }).marketHashName).toBe(
      'Music Kit | Valve, Counter-Strike 2',
    );
    expect(
      resolve({ id: '12', defIndex: DEF.MUSIC_KIT, musicId: 1, quality: QUALITY.STRANGE })
        .marketHashName,
    ).toBe('StatTrak™ Music Kit | Valve, Counter-Strike 2');
  });

  it('names storage units and keeps their label separate', () => {
    const item = resolve({
      id: '13',
      defIndex: DEF.STORAGE_UNIT,
      customName: 'knives',
      containedCount: 12,
    });
    expect(item.marketHashName).toBe('Storage Unit');
    expect(item.customName).toBe('knives');
    expect(item.isContainer).toBe(true);
  });

  it('ignores a float on items that have no exterior', () => {
    const item = resolve({ id: '14', defIndex: 4288, wear: 0.5 });
    expect(item.wearName).toBeNull();
    expect(item.marketHashName).toBe('Glove Case');
  });

  it('falls back to a placeholder for items the schema does not know', () => {
    const item = resolve({ id: '15', defIndex: 9999, paintIndex: 123 });
    expect(item.resolved).toBe(false);
    expect(item.marketHashName).toBe('Unknown item 9999 / paint 123');
  });
});

describe('buildCatalogIndex', () => {
  const sources: Record<string, unknown> = {
    'skins.json': [
      {
        name: 'AK-47 | Redline',
        paint_index: '282',
        weapon: { weapon_id: 7, name: 'AK-47' },
        rarity: { name: 'Classified', color: '#d32ce6' },
        category: { name: 'Rifles' },
      },
      {
        name: '★ Karambit | Fade',
        paint_index: '38',
        weapon: { weapon_id: 507, name: 'Karambit' },
        category: { name: 'Knives' },
      },
      // No weapon id: nothing we could key it by, so it must be skipped.
      { name: 'Broken entry', paint_index: '1', weapon: null },
    ],
    // Souvenir packages share a def index with their highlight variant.
    'crates.json': [
      { def_index: '4288', market_hash_name: 'Glove Case' },
      { def_index: '5120', market_hash_name: 'Austin 2025 Inferno Souvenir Package' },
      { def_index: '5120', market_hash_name: 'Austin 2025 Inferno Souvenir Highlight Package' },
    ],
    'collectibles.json': [],
    'agents.json': [{ def_index: '4613', market_hash_name: 'Bloody Darryl | The Professionals' }],
    'tools.json': [{ def_index: '1200', name: 'Name Tag' }],
    'stickers.json': [{ def_index: '1', market_hash_name: 'Sticker | Titan (Holo)' }],
    // Sealed graffiti are listed once per tint, all sharing one kit id.
    'graffiti.json': [
      { def_index: '1697', market_hash_name: 'Sealed Graffiti | X-Axes (Brick Red)' },
      { def_index: '1697', market_hash_name: 'Sealed Graffiti | X-Axes (Shark White)' },
      { def_index: '1653', market_hash_name: 'Sealed Graffiti | Blood Boiler' },
    ],
    'patches.json': [{ def_index: '4550', market_hash_name: 'Patch | Crazy Banana' }],
    'keychains.json': [{ def_index: '1', market_hash_name: "Charm | Lil' Ava" }],
    'highlights.json': [{ def_index: '1', market_hash_name: 'Souvenir Charm | Highlight' }],
    // Music kits are listed twice per id, StatTrak first here on purpose.
    'music_kits.json': [
      { def_index: '3', market_hash_name: 'StatTrak\u2122 Music Kit | Daniel Sadowski, Crimson Assault' },
      { def_index: '3', market_hash_name: 'Music Kit | Daniel Sadowski, Crimson Assault' },
      { def_index: '1', name: 'Valve, Counter-Strike 2', market_hash_name: null },
    ],
  };

  const fetcher = async (url: string) => {
    const file = url.split('/').pop() as string;
    if (!(file in sources)) throw new Error(`unexpected download: ${file}`);
    return sources[file];
  };

  it('keys skins by weapon and paint index', async () => {
    const index = await buildCatalogIndex({ baseUrl: 'https://example.test', fetcher });
    expect(index.skins['7:282']?.name).toBe('AK-47 | Redline');
    expect(index.skins['507:38']?.name).toBe('★ Karambit | Fade');
    expect(Object.keys(index.skins)).toHaveLength(2);
  });

  it('remembers plain weapon names and which ones carry a star', () => {
    return buildCatalogIndex({ baseUrl: 'https://example.test', fetcher }).then((index) => {
      expect(index.weapons['7']).toEqual({ name: 'AK-47', star: false });
      expect(index.weapons['507']).toEqual({ name: 'Karambit', star: true });
    });
  });

  it('keeps each family in its own namespace', async () => {
    const index = await buildCatalogIndex({ baseUrl: 'https://example.test', fetcher });
    // Id 1 means a different item in each of these tables.
    expect(index.stickers['1']?.name).toBe('Sticker | Titan (Holo)');
    expect(index.keychains['1']?.name).toBe("Charm | Lil' Ava");
    expect(index.highlights['1']?.name).toBe('Souvenir Charm | Highlight');
    expect(index.musicKits['1']?.name).toBe('Valve, Counter-Strike 2');
    expect(index.byDef['4288']?.name).toBe('Glove Case');
    expect(index.byDef['1200']?.name).toBe('Name Tag');
  });

  it('stores graffiti untinted so the tint on the item can be applied', async () => {
    const index = await buildCatalogIndex({ baseUrl: 'https://example.test', fetcher });
    expect(index.graffiti['1697']?.name).toBe('Sealed Graffiti | X-Axes');
    expect(index.graffiti['1653']?.name).toBe('Sealed Graffiti | Blood Boiler');
  });

  it('stores the plain music kit title even when StatTrak is listed first', async () => {
    const index = await buildCatalogIndex({ baseUrl: 'https://example.test', fetcher });
    expect(index.musicKits['3']?.name).toBe('Music Kit | Daniel Sadowski, Crimson Assault');
  });

  it('keeps the first row when one def index is listed twice', async () => {
    const index = await buildCatalogIndex({ baseUrl: 'https://example.test', fetcher });
    expect(index.byDef['5120']?.name).toBe('Austin 2025 Inferno Souvenir Package');
  });

  it('rejects a source that is not an array', async () => {
    await expect(
      buildCatalogIndex({ baseUrl: 'https://example.test', fetcher: async () => ({ oops: true }) }),
    ).rejects.toThrow(/not a JSON array/);
  });
});
