// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  BulkPriceSource,
  describeAge,
  formatMoney,
  isStale,
  loadPrices,
  parseBulkPrices,
  savePrices,
  toMinorUnits,
  valueOf,
} from '../extension/src/prices.js';
import { installChromeStorage } from './extension-storage-helper.js';

/**
 * Prices, and the arithmetic on top of them.
 *
 * Money is the part of this project where being quietly wrong is easiest and
 * worst: a total that is off by a cent per item is off by a hundred and sixty
 * pounds across this inventory, and nothing on screen would look odd.
 */

beforeEach(() => installChromeStorage());

describe('converting a price to minor units', () => {
  it('converts ordinary prices exactly', () => {
    expect(toMinorUnits(10.55)).toBe(1055);
    expect(toMinorUnits(0.07)).toBe(7);
    expect(toMinorUnits(29.29)).toBe(2929);
  });

  it('rounds to the nearest cent rather than truncating', () => {
    expect(toMinorUnits(1.994)).toBe(199);
    expect(toMinorUnits(1.996)).toBe(200);
  });

  it('does not round up on a multiplication artifact', () => {
    /*
     * The obvious `Math.round(x * 100)` is wrong here, and wrong in the
     * direction that inflates a portfolio. 1.115 is not exactly 1.115 -- it is
     * stored as 1.11499999999999999... -- but multiplying by 100 lands on
     * exactly 111.5, which then rounds up. Going via the decimal string
     * respects the value actually stored.
     */
    expect(Math.round(1.115 * 100)).toBe(112);
    expect(toMinorUnits(1.115)).toBe(111);

    expect(Math.round(2.675 * 100)).toBe(268);
    expect(toMinorUnits(2.675)).toBe(267);
  });

  it('treats nonsense as nothing rather than as NaN', () => {
    // A NaN in one price poisons the whole total.
    expect(toMinorUnits(Number.NaN)).toBe(0);
    expect(toMinorUnits(Infinity)).toBe(0);
    expect(toMinorUnits(-5)).toBe(0);
  });
});

describe('valuing an inventory', () => {
  const prices = {
    'AK-47 | Redline (Field-Tested)': 1055,
    'Revolution Case': 29,
  };

  it('adds up exactly, with no drift across many items', () => {
    const items = Array.from({ length: 16_000 }, () => ({
      marketHashName: 'AK-47 | Redline (Field-Tested)',
    }));

    // Integer arithmetic throughout, so this is exact rather than close.
    expect(valueOf(items, prices).total).toBe(16_000 * 1055);
  });

  it('reports what it could not price instead of counting it as zero', () => {
    const value = valueOf(
      [
        { marketHashName: 'AK-47 | Redline (Field-Tested)' },
        { marketHashName: 'Revolution Case' },
        { marketHashName: 'Souvenir package nobody trades' },
      ],
      prices,
    );

    // A total that silently omits unpriced items invites trusting a number
    // that is too low.
    expect(value).toEqual({ total: 1055 + 29, priced: 2, unpriced: 1 });
  });

  it('is zero for nothing, not NaN', () => {
    expect(valueOf([], prices)).toEqual({ total: 0, priced: 0, unpriced: 0 });
  });
});

describe('formatting money', () => {
  it('shows a currency amount', () => {
    // Locale decides the exact punctuation, so check the parts that matter.
    const formatted = formatMoney(168_800, 'USD');
    expect(formatted).toMatch(/1,688\.00|1688\.00/);
    expect(formatted).toMatch(/\$|USD/);
  });

  it('does not take the page down on a currency code it does not know', () => {
    expect(formatMoney(1055, 'NOTACURRENCY')).toBe('10.55 NOTACURRENCY');
  });
});

describe('reading a bulk price file', () => {
  it('prefers a median over a single recent sale', () => {
    // One sale can be anything; a portfolio built on outliers swings for no
    // reason at all.
    const table = parseBulkPrices({
      'AK-47 | Redline (Field-Tested)': { steam: { last_24h: 99, last_7d: 10.55 } },
    });
    expect(table['AK-47 | Redline (Field-Tested)']).toBe(1055);
  });

  it('falls back through the fields it knows', () => {
    expect(parseBulkPrices({ a: { steam: { last_30d: 2.5 } } }).a).toBe(250);
    expect(parseBulkPrices({ b: { last_24h: 1.25 } }).b).toBe(125);
    expect(parseBulkPrices({ c: 3.5 }).c).toBe(350);
  });

  it("reads Steam's own string format", () => {
    expect(parseBulkPrices({ a: { median_price: '$10.55' } }).a).toBe(1055);
  });

  it('skips entries it cannot read rather than pricing them at zero', () => {
    const table = parseBulkPrices({
      good: { steam: { last_7d: 1 } },
      empty: {},
      nulled: null,
      zero: { steam: { last_7d: 0 } },
      text: 'not a price',
    });

    // Present-but-unpriceable must look the same as absent, so valueOf can
    // count it as unpriced.
    expect(Object.keys(table)).toEqual(['good']);
  });

  it('refuses a reply that is not a price table at all', () => {
    expect(() => parseBulkPrices(null)).toThrow(/did not return a price table/);
    expect(() => parseBulkPrices('nope')).toThrow(/did not return a price table/);
    expect(() => parseBulkPrices({})).toThrow(/no usable prices/);
    // A file that parses but prices nothing is a changed format, not an empty
    // market, and silently storing it would show every item as unpriced.
    expect(() => parseBulkPrices({ a: {}, b: null })).toThrow(/no usable prices/);
  });
});

describe('the price source', () => {
  it('fetches the url it was given and parses the reply', async () => {
    let asked = '';
    const source = new BulkPriceSource('https://example.test/prices.json');
    const table = await source.fetch((url) => {
      asked = url;
      return Promise.resolve({ 'Revolution Case': { steam: { last_7d: 0.29 } } });
    });

    expect(asked).toBe('https://example.test/prices.json');
    expect(table['Revolution Case']).toBe(29);
  });

  it('names itself, so a number on screen has a provenance', () => {
    const source = new BulkPriceSource('https://example.test/prices.json');
    expect(source.name).toBeTruthy();
    expect(source.currency).toBe('USD');
  });
});

describe('storing prices', () => {
  const data = {
    prices: { a: 100 },
    currency: 'USD',
    fetchedAt: '2026-09-12T12:00:00.000Z',
    source: 'test',
  };

  it('round-trips', async () => {
    await savePrices(data);
    expect(await loadPrices()).toMatchObject(data);
  });

  it('ignores a table stored in an older shape', async () => {
    await chrome.storage.local.set({ prices: { version: 0, prices: { a: 1 } } });
    expect(await loadPrices()).toBeNull();
  });

  it('is absent before anything is fetched', async () => {
    expect(await loadPrices()).toBeNull();
  });
});

describe('how old the prices are', () => {
  const at = (iso: string) => ({ ...{ version: 1, prices: {}, currency: 'USD', source: 't' }, fetchedAt: iso });
  const now = Date.parse('2026-09-12T12:00:00.000Z');

  it('is fresh within a day and stale after', () => {
    expect(isStale(at('2026-09-12T00:00:00.000Z'), now)).toBe(false);
    expect(isStale(at('2026-09-11T11:00:00.000Z'), now)).toBe(true);
  });

  it('says how old in words a person would use', () => {
    expect(describeAge(at('2026-09-12T11:45:00.000Z'), now)).toBe('updated just now');
    expect(describeAge(at('2026-09-12T11:00:00.000Z'), now)).toBe('updated 1 hour ago');
    expect(describeAge(at('2026-09-12T07:00:00.000Z'), now)).toBe('updated 5 hours ago');
    expect(describeAge(at('2026-09-10T12:00:00.000Z'), now)).toBe('updated 2 days ago');
  });
});
