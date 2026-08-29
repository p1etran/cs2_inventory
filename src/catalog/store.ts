import fs from 'node:fs/promises';
import path from 'node:path';
import { Catalog } from './catalog.js';
import { buildCatalogIndex, type BuildOptions } from './build.js';
import { CATALOG_VERSION, type CatalogIndex } from './types.js';

/** Rebuild the cached schema when it is older than this. */
export const CATALOG_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function readCatalogIndex(filePath: string): Promise<CatalogIndex | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as CatalogIndex;
    if (parsed.version !== CATALOG_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCatalogIndex(filePath: string, index: CatalogIndex): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(index), 'utf8');
}

export function isStale(index: CatalogIndex, now = Date.now()): boolean {
  const builtAt = Date.parse(index.builtAt);
  if (!Number.isFinite(builtAt)) return true;
  return now - builtAt > CATALOG_MAX_AGE_MS;
}

export interface LoadCatalogOptions extends BuildOptions {
  filePath: string;
  /** Download a fresh copy even when the cache is still fresh. */
  force?: boolean;
}

/**
 * Loads the cached item schema, downloading it when missing, stale or forced.
 * A stale-but-usable cache beats failing outright, so a network blip during a
 * refresh never blocks a sync.
 */
export async function loadCatalog(options: LoadCatalogOptions): Promise<Catalog> {
  const cached = options.force ? null : await readCatalogIndex(options.filePath);
  if (cached && !isStale(cached)) {
    return new Catalog(cached);
  }

  try {
    const fresh = await buildCatalogIndex(options);
    await writeCatalogIndex(options.filePath, fresh);
    return new Catalog(fresh);
  } catch (error) {
    if (cached) {
      options.onProgress?.(
        `schema download failed (${(error as Error).message}); using cached copy`,
      );
      return new Catalog(cached);
    }
    throw error;
  }
}
