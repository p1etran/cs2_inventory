import { describe, expect, it } from 'vitest';
import { buildMarketHashName, searchKey, wearName } from '../src/domain/names.js';

describe('wearName', () => {
  it('maps floats to the exteriors CS2 uses', () => {
    expect(wearName(0)).toBe('Factory New');
    expect(wearName(0.0699)).toBe('Factory New');
    expect(wearName(0.07)).toBe('Minimal Wear');
    expect(wearName(0.1499)).toBe('Minimal Wear');
    expect(wearName(0.15)).toBe('Field-Tested');
    expect(wearName(0.3799)).toBe('Field-Tested');
    expect(wearName(0.38)).toBe('Well-Worn');
    expect(wearName(0.4499)).toBe('Well-Worn');
    expect(wearName(0.45)).toBe('Battle-Scarred');
    expect(wearName(0.99)).toBe('Battle-Scarred');
  });

  it('returns null when there is no float', () => {
    expect(wearName(null)).toBeNull();
    expect(wearName(undefined)).toBeNull();
    expect(wearName(Number.NaN)).toBeNull();
  });
});

describe('buildMarketHashName', () => {
  it('builds a plain skin name', () => {
    expect(buildMarketHashName({ baseName: 'AK-47 | Redline', wear: 'Field-Tested' })).toBe(
      'AK-47 | Redline (Field-Tested)',
    );
  });

  it('puts StatTrak after the star on knives and gloves', () => {
    expect(
      buildMarketHashName({
        baseName: '★ Karambit | Doppler',
        stattrak: true,
        wear: 'Factory New',
      }),
    ).toBe('★ StatTrak™ Karambit | Doppler (Factory New)');
  });

  it('prefixes StatTrak on ordinary weapons', () => {
    expect(buildMarketHashName({ baseName: 'AWP | Asiimov', stattrak: true, wear: 'Well-Worn' })).toBe(
      'StatTrak™ AWP | Asiimov (Well-Worn)',
    );
  });

  it('prefers Souvenir when both qualities somehow appear', () => {
    expect(
      buildMarketHashName({
        baseName: 'AWP | Dragon Lore',
        stattrak: true,
        souvenir: true,
        wear: 'Factory New',
      }),
    ).toBe('Souvenir AWP | Dragon Lore (Factory New)');
  });

  it('leaves the exterior off items that have none', () => {
    expect(buildMarketHashName({ baseName: 'Sticker | Titan (Holo) | Katowice 2014' })).toBe(
      'Sticker | Titan (Holo) | Katowice 2014',
    );
  });

  it('keeps a vanilla knife name intact', () => {
    expect(buildMarketHashName({ baseName: '★ Bayonet' })).toBe('★ Bayonet');
    expect(buildMarketHashName({ baseName: '★ Bayonet', stattrak: true })).toBe(
      '★ StatTrak™ Bayonet',
    );
  });
});

describe('searchKey', () => {
  it('folds punctuation so partial words still match', () => {
    expect(searchKey('★ StatTrak™ Karambit | Doppler (Factory New)')).toBe(
      'stattrak karambit doppler factory new',
    );
  });

  it('joins several fields and ignores blanks', () => {
    expect(searchKey('AK-47 | Redline', null, 'overpay unit')).toBe(
      'ak-47 redline overpay unit',
    );
  });
});
