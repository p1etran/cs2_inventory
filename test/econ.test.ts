import { describe, expect, it } from 'vitest';
import { DEF, QUALITY } from '../src/domain/attributes.js';
import { normalizeEconItem } from '../src/domain/econ.js';
import { econItem } from './helpers.js';

describe('normalizeEconItem', () => {
  it('reads paint, seed and float off the attribute bag', () => {
    const item = normalizeEconItem(
      econItem({ id: '1', defIndex: 7, paintIndex: 282, paintSeed: 661, wear: 0.2134 }),
    );
    expect(item.paintIndex).toBe(282);
    expect(item.paintSeed).toBe(661);
    expect(item.floatValue).toBeCloseTo(0.2134, 6);
  });

  it('reassembles a 64-bit storage unit id from its two halves', () => {
    // Larger than 2^53, so a naive number would lose precision here.
    const casketId = '39457183930000123';
    const item = normalizeEconItem(econItem({ id: '2', defIndex: 7, casketId }));
    expect(item.containerId).toBe(casketId);
  });

  it('identifies storage units and their item count', () => {
    const item = normalizeEconItem(
      econItem({
        id: '3',
        defIndex: DEF.STORAGE_UNIT,
        containedCount: 847,
        customName: 'cases - do not open',
      }),
    );
    expect(item.isContainer).toBe(true);
    expect(item.containedCount).toBe(847);
    expect(item.customName).toBe('cases - do not open');
    expect(item.containerId).toBeNull();
  });

  it('decodes multi-byte characters in name tags', () => {
    const item = normalizeEconItem(
      econItem({ id: '4', defIndex: DEF.STORAGE_UNIT, customName: 'zapas – noże ★' }),
    );
    expect(item.customName).toBe('zapas – noże ★');
  });

  it('derives StatTrak and Souvenir from quality', () => {
    const stattrak = normalizeEconItem(econItem({ id: '5', defIndex: 7, quality: QUALITY.STRANGE }));
    expect(stattrak.stattrak).toBe(true);
    expect(stattrak.souvenir).toBe(false);

    const souvenir = normalizeEconItem(
      econItem({ id: '6', defIndex: 9, quality: QUALITY.TOURNAMENT }),
    );
    expect(souvenir.souvenir).toBe(true);
    expect(souvenir.stattrak).toBe(false);
  });

  it('collects stickers with their slots', () => {
    const item = normalizeEconItem(
      econItem({ id: '7', defIndex: 7, paintIndex: 44, stickerIds: [1234, 5678] }),
    );
    expect(item.stickers).toEqual([
      { slot: 0, stickerId: 1234, wear: null },
      { slot: 1, stickerId: 5678, wear: null },
    ]);
  });

  it('keeps charm and highlight ids apart', () => {
    const charm = normalizeEconItem(econItem({ id: '8', defIndex: DEF.KEYCHAIN, keychainId: 12 }));
    expect(charm.keychain).toEqual({ keychainId: 12, seed: null, highlightId: null });

    const highlight = normalizeEconItem(
      econItem({ id: '9', defIndex: DEF.KEYCHAIN, keychainId: 0, highlightId: 42 }),
    );
    expect(highlight.keychain?.highlightId).toBe(42);
  });

  it('falls back to the fields the library pre-parses', () => {
    const item = normalizeEconItem({
      id: '10',
      def_index: 7,
      paint_index: 44,
      paint_wear: 0.5,
      casket_id: '999',
      attribute: [],
    });
    expect(item.paintIndex).toBe(44);
    expect(item.floatValue).toBe(0.5);
    expect(item.containerId).toBe('999');
  });

  it('handles ids that arrive as objects rather than strings', () => {
    const item = normalizeEconItem({ id: { toString: () => '12345678901234567' }, def_index: 7 });
    expect(item.assetId).toBe('12345678901234567');
  });
});
