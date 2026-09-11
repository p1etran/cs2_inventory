import type { Db } from './db/database.js';
import { listContainers, searchItems, type ItemRow, type SearchOptions } from './db/repo.js';
import { toCsv } from './util/csv.js';

/** searchItems caps a single page at 1000 rows, so an export walks it in pages. */
const PAGE_SIZE = 1000;

const HEADERS = [
  'asset_id',
  'market_hash_name',
  'exterior',
  'float',
  'paint_seed',
  'stattrak',
  'souvenir',
  'rarity',
  'category',
  'location',
  'name_tag',
  'first_seen',
];

export interface ExportData {
  items: ItemRow[];
  labels: Map<string, string>;
}

export function describeLocation(row: ItemRow, containerLabels: Map<string, string>): string {
  if (!row.container_id) return 'inventory';
  return containerLabels.get(row.container_id) ?? `unit ${row.container_id}`;
}

/**
 * Every row matching `options`, paged through in one read transaction so a sync
 * running alongside the web UI cannot shift rows between pages. `limit` and
 * `offset` are ignored: an export is the whole filtered set, not a page of it.
 */
export function collectExport(db: Db, options: SearchOptions = {}): ExportData {
  const gather = db.transaction((search: SearchOptions): ExportData => {
    const labels = new Map(listContainers(db).map((c) => [c.asset_id, c.label]));
    const items: ItemRow[] = [];
    const total = searchItems(db, { ...search, limit: 1, offset: 0 }).total;
    for (let offset = 0; offset < total; offset += PAGE_SIZE) {
      items.push(...searchItems(db, { ...search, limit: PAGE_SIZE, offset }).items);
    }
    return { items, labels };
  });
  return gather(options);
}

export function exportCsv({ items, labels }: ExportData): string {
  return toCsv(
    HEADERS,
    items.map((row) => [
      row.asset_id,
      row.market_hash_name,
      row.wear_name,
      row.float_value,
      row.paint_seed,
      row.stattrak ? 'yes' : '',
      row.souvenir ? 'yes' : '',
      row.rarity_name,
      row.category,
      describeLocation(row, labels),
      row.is_container ? '' : row.custom_name,
      row.first_seen,
    ]),
  );
}

export function exportJson({ items }: ExportData): string {
  return `${JSON.stringify(items, null, 2)}\n`;
}

export function exportFilename(format: 'csv' | 'json', now = new Date()): string {
  return `cs2-inventory-${now.toISOString().slice(0, 10)}.${format}`;
}
