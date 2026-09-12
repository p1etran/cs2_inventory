/**
 * The part of this codebase that runs anywhere.
 *
 * Everything re-exported here is free of Node built-ins and Node-only
 * packages, so it bundles for a browser as well as it runs on a server. That
 * matters because the expensive, fiddly logic lives in exactly these modules:
 * turning the game coordinator's raw `def_index` and `paint_index` into real
 * item names, and reconciling one inventory snapshot against the next.
 *
 * `test/portability.test.ts` bundles this entry point for the browser and
 * fails if a Node dependency ever creeps back in, so the guarantee is checked
 * rather than merely intended.
 *
 * Storage, the terminal, the HTTP server and the Steam client are deliberately
 * absent: those are platform-specific by nature and live outside this surface.
 */

export * from './domain/types.js';
export * from './domain/attributes.js';
export * from './domain/econ.js';
export * from './domain/names.js';
export * from './domain/diff.js';
export * from './domain/jwt.js';

export { Catalog } from './catalog/catalog.js';
export * from './catalog/types.js';
export { GRAFFITI_TINTS } from './catalog/tints.js';
export { buildCatalogIndex, type BuildOptions, type Fetcher } from './catalog/build.js';
