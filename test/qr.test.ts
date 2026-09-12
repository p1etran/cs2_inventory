import { describe, expect, it } from 'vitest';
import qrcode from 'qrcode-generator';
import { qrGeometry } from '../extension/src/ui/qr.js';

/**
 * The QR geometry, checked without a browser.
 *
 * A code that renders but does not scan is the failure mode worth guarding:
 * no error appears anywhere, the user just holds up their phone and nothing
 * happens. So these check the properties a scanner actually depends on.
 */

// A realistic Steam challenge URL; length drives the chosen version.
const CHALLENGE = 'https://s.team/q/1/2372462679780599330';

describe('QR geometry', () => {
  it('keeps the four-module quiet zone a scanner needs', () => {
    const { modules, size } = qrGeometry(CHALLENGE);
    expect(size).toBe(modules + 8);
  });

  it('picks a version that can hold the URL', () => {
    // Version 1 is 21 modules and grows by 4; anything in that family is fine,
    // but it must be big enough to have encoded the whole string.
    const { modules } = qrGeometry(CHALLENGE);
    expect(modules).toBeGreaterThanOrEqual(21);
    expect((modules - 21) % 4).toBe(0);
  });

  it('grows with the data rather than silently truncating', () => {
    const short = qrGeometry('https://s.team/q/1/1').modules;
    const long = qrGeometry(`https://s.team/q/1/${'9'.repeat(300)}`).modules;
    expect(long).toBeGreaterThan(short);
  });

  it('draws the three finder patterns, inset by the quiet zone', () => {
    const { path, size } = qrGeometry(CHALLENGE);
    // Every QR has a dark module at the top-left of each finder pattern. The
    // top-left one sits exactly at the quiet-zone offset.
    expect(path).toContain('M4 4h1v1h-1z');
    // And nothing is drawn outside the code area.
    const coordinates = [...path.matchAll(/M(\d+) (\d+)h/g)].flatMap((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    expect(Math.min(...coordinates)).toBe(4);
    expect(Math.max(...coordinates)).toBeLessThan(size - 4);
  });

  it('produces a dark-module count in a plausible range', () => {
    // Roughly half the modules are dark in any real code. Far outside that
    // means the grid is being read wrong rather than encoded wrong.
    const { modules, path } = qrGeometry(CHALLENGE);
    const dark = (path.match(/h1v1h-1z/g) ?? []).length;
    const total = modules * modules;
    expect(dark / total).toBeGreaterThan(0.25);
    expect(dark / total).toBeLessThan(0.75);
  });

  it('draws modules in the library\'s own orientation, not transposed', () => {
    // A transposed QR is a mirror image, and scanners read rotations but not
    // reflections -- so this fails as "the phone just does nothing". Checked
    // against the library's own renderer rather than against our loop, since
    // our loop is the thing under test.
    const qr = qrcode(0, 'M');
    qr.addData(CHALLENGE);
    qr.make();
    const reference = new Set(
      [...qr.createSvgTag({ cellSize: 1, margin: 0 }).matchAll(/M(\d+),(\d+)l/g)].map(
        (match) => `${match[1]},${match[2]}`,
      ),
    );

    const ours = new Set(
      [...qrGeometry(CHALLENGE).path.matchAll(/M(\d+) (\d+)h/g)].map(
        (match) => `${Number(match[1]) - 4},${Number(match[2]) - 4}`,
      ),
    );

    expect(ours.size).toBe(reference.size);
    expect([...ours].sort()).toEqual([...reference].sort());
  });

  it('gives the same code for the same URL', () => {
    expect(qrGeometry(CHALLENGE).path).toBe(qrGeometry(CHALLENGE).path);
  });
});
