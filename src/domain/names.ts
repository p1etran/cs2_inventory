import { QUALITY } from './attributes.js';

export interface WearBucket {
  name: string;
  /** Exclusive upper bound; a float equal to this belongs to the next bucket. */
  max: number;
}

/** CS2 exterior boundaries. A float exactly on a boundary rounds up a tier. */
export const WEAR_BUCKETS: readonly WearBucket[] = [
  { name: 'Factory New', max: 0.07 },
  { name: 'Minimal Wear', max: 0.15 },
  { name: 'Field-Tested', max: 0.38 },
  { name: 'Well-Worn', max: 0.45 },
  { name: 'Battle-Scarred', max: Infinity },
];

export function wearName(floatValue: number | null | undefined): string | null {
  if (floatValue === null || floatValue === undefined || Number.isNaN(floatValue)) return null;
  for (const bucket of WEAR_BUCKETS) {
    if (floatValue < bucket.max) return bucket.name;
  }
  return null;
}

export function isStatTrak(quality: number | null | undefined): boolean {
  return quality === QUALITY.STRANGE;
}

export function isSouvenir(quality: number | null | undefined): boolean {
  return quality === QUALITY.TOURNAMENT;
}

export interface MarketNameParts {
  /** Catalog name, e.g. "AK-47 | Redline" or "★ Karambit | Doppler". */
  baseName: string;
  stattrak?: boolean;
  souvenir?: boolean;
  wear?: string | null;
}

const STAR = '★';
const STATTRAK = 'StatTrak™';

/**
 * Assembles a Steam market_hash_name. The quality prefix goes after the star
 * that knives and gloves carry, which is why this is not a plain concat.
 * StatTrak and Souvenir are mutually exclusive in game; Souvenir wins.
 */
export function buildMarketHashName(parts: MarketNameParts): string {
  let name = parts.baseName;

  if (parts.souvenir) {
    name = `Souvenir ${name}`;
  } else if (parts.stattrak) {
    name = name.startsWith(`${STAR} `)
      ? `${STAR} ${STATTRAK} ${name.slice(2)}`
      : `${STATTRAK} ${name}`;
  }

  if (parts.wear) {
    name = `${name} (${parts.wear})`;
  }
  return name;
}

/** Normalizes a name for substring search: lowercase, no punctuation noise. */
export function searchKey(...values: (string | null | undefined)[]): string {
  return values
    .filter((v): v is string => Boolean(v))
    .join(' ')
    .toLowerCase()
    .replace(/[★™|()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
