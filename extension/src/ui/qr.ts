import qrcode from 'qrcode-generator';

/**
 * Draws a QR code as inline SVG.
 *
 * SVG rather than a canvas so it stays sharp at any size and needs no pixel
 * ratio handling, and one `<path>` rather than a rect per module so a 40-ish
 * module code is one element instead of sixteen hundred.
 *
 * The colours come from the page, not from here: `currentColor` for the
 * modules and an explicit light background, because a QR code must keep dark
 * modules on a light field to scan -- inverting it for a dark theme would
 * produce a code most readers refuse.
 */

/** Quiet zone, in modules. The spec asks for four; anything less risks a misread. */
const QUIET_ZONE = 4;

export interface QrGeometry {
  /** Modules per side, excluding the quiet zone. */
  modules: number;
  /** Side of the drawing including the quiet zone, in module units. */
  size: number;
  /** SVG path data covering every dark module. */
  path: string;
}

/**
 * The code's geometry, with no DOM involved.
 *
 * Separated out because this is the part that can be wrong in a way a person
 * would not notice until a phone refuses to scan -- a missing quiet zone, an
 * off-by-one in the module grid, a transposed row and column. Those are worth
 * testing, and testing them should not need a browser.
 */
export function qrGeometry(text: string): QrGeometry {
  // Type 0 lets the library pick the smallest version that fits, and level M
  // survives a little dirt on a screen without inflating the code.
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const modules = qr.getModuleCount();
  const segments: string[] = [];
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      // isDark takes (row, column); swapping them mirrors the code and it
      // stops scanning, which is why the order is spelled out here.
      if (!qr.isDark(row, column)) continue;
      segments.push(`M${column + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
    }
  }

  return { modules, size: modules + QUIET_ZONE * 2, path: segments.join('') };
}

export function renderQrSvg(text: string): SVGSVGElement {
  const { size, path: pathData } = qrGeometry(text);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', '232');
  svg.setAttribute('height', '232');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Steam sign-in QR code');
  // shape-rendering keeps module edges crisp instead of anti-aliased to grey.
  svg.setAttribute('shape-rendering', 'crispEdges');

  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', String(size));
  background.setAttribute('height', String(size));
  background.setAttribute('fill', '#ffffff');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', '#000000');

  svg.append(background, path);
  return svg;
}
