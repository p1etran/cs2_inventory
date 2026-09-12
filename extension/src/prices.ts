/**
 * Item prices, and what an inventory is worth.
 *
 * Money is kept in integer minor units -- cents, grosze, whatever the currency
 * divides into -- and never as a float. Summing sixteen thousand floats
 * accumulates error that shows up as a total ending in 0.9999999, and a
 * portfolio figure that is visibly wrong in the last digit is worse than no
 * figure at all.
 *
 * The price source is behind an interface on purpose. Every public source for
 * CS2 prices is somebody's free side project or Valve's own heavily
 * rate-limited endpoint, and any of them can change shape or disappear. What
 * must not change when one does is the valuation, the storage, or the UI.
 */

const KEY = 'prices';
const VERSION = 1;

/** Steam's market is priced per item name, so that is the key. */
export type PriceTable = Record<string, number>;

export interface PriceData {
  version: number;
  /** Minor units, keyed by market hash name. */
  prices: PriceTable;
  currency: string;
  fetchedAt: string;
  source: string;
}

/** How old a price table can be before the UI should say so. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface Valuation {
  /** Total in minor units. */
  total: number;
  /** Items that had a price. */
  priced: number;
  /** Items with no price, which is why a total can be an understatement. */
  unpriced: number;
}

export interface Priceable {
  marketHashName: string;
}

/**
 * Adds up what a set of items is worth.
 *
 * Reports what it could not price rather than silently treating it as zero.
 * An inventory is full of things with no market listing -- souvenir packages,
 * odd graffiti, anything Valve has never let trade -- and a total that quietly
 * omits them invites someone to trust a number that is too low.
 */
export function valueOf(items: readonly Priceable[], prices: PriceTable): Valuation {
  let total = 0;
  let priced = 0;
  let unpriced = 0;

  for (const item of items) {
    const price = prices[item.marketHashName];
    if (price === undefined) {
      unpriced += 1;
      continue;
    }
    total += price;
    priced += 1;
  }

  return { total, priced, unpriced };
}

/** Formats minor units for display, in the currency the table was fetched in. */
export function formatMoney(minorUnits: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
      minorUnits / 100,
    );
  } catch {
    // An unknown currency code should not take the page down with it.
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}

/**
 * Turns a price in major units into minor ones.
 *
 * Rounds rather than truncates, and goes via a string to avoid the classic
 * `10.55 * 100 === 1054.9999999999998`.
 */
export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(Number(amount.toFixed(2)) * 100);
}

export interface PriceSource {
  /** Shown in the UI so the number's provenance is never a mystery. */
  readonly name: string;
  readonly currency: string;
  fetch(fetcher: (url: string) => Promise<unknown>): Promise<PriceTable>;
}

/**
 * Prices from a public bulk file.
 *
 * One request covers every item name, which matters: pricing this inventory
 * one name at a time through Steam's own endpoint would be about 1,200
 * requests against a limit of roughly 20 a minute.
 *
 * The shape is defensive on purpose -- it reads whichever of several known
 * field names is present and ignores anything it does not understand, because
 * this is somebody else's file and it will change without warning.
 */
export class BulkPriceSource implements PriceSource {
  readonly name = 'csgotrader.app (Steam market, 7-day median)';
  readonly currency = 'USD';

  constructor(private readonly url: string) {}

  async fetch(fetcher: (url: string) => Promise<unknown>): Promise<PriceTable> {
    return parseBulkPrices(await fetcher(this.url));
  }
}

/** Reads a bulk price file. Pure, so its quirks can be tested without the network. */
export function parseBulkPrices(body: unknown): PriceTable {
  if (!body || typeof body !== 'object') {
    throw new Error('The price source did not return a price table');
  }

  const table: PriceTable = {};
  for (const [name, value] of Object.entries(body as Record<string, unknown>)) {
    const price = readPrice(value);
    if (price !== null) table[name] = price;
  }

  if (Object.keys(table).length === 0) {
    throw new Error('The price source returned no usable prices');
  }
  return table;
}

/**
 * Digs a usable number out of one entry.
 *
 * Prefers a median over a last-sale price: a single sale can be anything, and
 * a portfolio built on outliers swings for no reason.
 */
function readPrice(value: unknown): number | null {
  if (typeof value === 'number') return toMinorUnits(value);
  if (!value || typeof value !== 'object') return null;

  const entry = value as Record<string, unknown>;
  const steam = (entry.steam ?? entry) as Record<string, unknown>;

  for (const field of ['last_7d', 'last_30d', 'last_24h', 'median_price', 'price']) {
    const candidate = steam[field];
    if (typeof candidate === 'number' && candidate > 0) return toMinorUnits(candidate);
    // Steam's own endpoint gives strings like "$10.55".
    if (typeof candidate === 'string') {
      const parsed = Number(candidate.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) return toMinorUnits(parsed);
    }
  }
  return null;
}

export async function loadPrices(): Promise<PriceData | null> {
  const stored = await chrome.storage.local.get(KEY);
  const data = stored[KEY] as PriceData | undefined;
  return data?.version === VERSION ? data : null;
}

export async function savePrices(data: Omit<PriceData, 'version'>): Promise<void> {
  await chrome.storage.local.set({ [KEY]: { ...data, version: VERSION } satisfies PriceData });
}

export async function forgetPrices(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}

export function isStale(data: PriceData, now = Date.now()): boolean {
  return now - new Date(data.fetchedAt).getTime() > STALE_AFTER_MS;
}

/** How old the prices are, in words. */
export function describeAge(data: PriceData, now = Date.now()): string {
  const ms = now - new Date(data.fetchedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'updated just now';
  if (hours < 24) return `updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `updated ${days} day${days === 1 ? '' : 's'} ago`;
}
