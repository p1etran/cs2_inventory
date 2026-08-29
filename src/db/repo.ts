import { searchKey } from '../domain/names.js';
import type { InventoryDiff, Placement } from '../domain/diff.js';
import type { ResolvedItem } from '../domain/types.js';
import type { Db } from './database.js';

export interface ItemRow {
  asset_id: string;
  def_index: number;
  paint_index: number | null;
  paint_seed: number | null;
  float_value: number | null;
  market_hash_name: string;
  base_name: string;
  wear_name: string | null;
  rarity_name: string | null;
  rarity_color: string | null;
  category: string | null;
  image_url: string | null;
  custom_name: string | null;
  stattrak: number;
  souvenir: number;
  container_id: string | null;
  is_container: number;
  contained_count: number | null;
  stickers_json: string | null;
  keychain_json: string | null;
  tradable_after: string | null;
  resolved: number;
  first_seen: string;
  last_seen: string;
}

export interface ContainerRow {
  asset_id: string;
  label: string;
  /** What the game says the unit holds. */
  contained_count: number;
  /** How many of those items we have actually enumerated and stored. */
  stored_count: number;
}

const UPSERT_SQL = `
INSERT INTO items (
  asset_id, def_index, paint_index, paint_seed, float_value, quality, rarity,
  market_hash_name, base_name, wear_name, rarity_name, rarity_color, category,
  image_url, custom_name, stattrak, souvenir, container_id, is_container,
  contained_count, stickers_json, keychain_json, tradable_after, origin,
  position, resolved, search_text, first_seen, last_seen, removed_at
) VALUES (
  @asset_id, @def_index, @paint_index, @paint_seed, @float_value, @quality, @rarity,
  @market_hash_name, @base_name, @wear_name, @rarity_name, @rarity_color, @category,
  @image_url, @custom_name, @stattrak, @souvenir, @container_id, @is_container,
  @contained_count, @stickers_json, @keychain_json, @tradable_after, @origin,
  @position, @resolved, @search_text, @seen_at, @seen_at, NULL
)
ON CONFLICT (asset_id) DO UPDATE SET
  def_index = excluded.def_index,
  paint_index = excluded.paint_index,
  paint_seed = excluded.paint_seed,
  float_value = excluded.float_value,
  quality = excluded.quality,
  rarity = excluded.rarity,
  market_hash_name = excluded.market_hash_name,
  base_name = excluded.base_name,
  wear_name = excluded.wear_name,
  rarity_name = excluded.rarity_name,
  rarity_color = excluded.rarity_color,
  category = excluded.category,
  image_url = excluded.image_url,
  custom_name = excluded.custom_name,
  stattrak = excluded.stattrak,
  souvenir = excluded.souvenir,
  container_id = excluded.container_id,
  is_container = excluded.is_container,
  contained_count = excluded.contained_count,
  stickers_json = excluded.stickers_json,
  keychain_json = excluded.keychain_json,
  tradable_after = excluded.tradable_after,
  origin = excluded.origin,
  position = excluded.position,
  resolved = excluded.resolved,
  search_text = excluded.search_text,
  last_seen = excluded.last_seen,
  removed_at = NULL
`;

/**
 * Current inventory keyed by asset id. Items removed by an earlier sync stay
 * in the table for history, so they are excluded here.
 */
export function livePlacements(db: Db): Map<string, Placement> {
  const rows = db
    .prepare(
      'SELECT asset_id, container_id, market_hash_name FROM items WHERE removed_at IS NULL',
    )
    .all() as { asset_id: string; container_id: string | null; market_hash_name: string }[];

  return new Map(
    rows.map((row) => [
      row.asset_id,
      { containerId: row.container_id, marketHashName: row.market_hash_name },
    ]),
  );
}

export function upsertItems(db: Db, items: ResolvedItem[], seenAt: string): void {
  const statement = db.prepare(UPSERT_SQL);
  const containerLabels = new Map<string, string>();
  for (const item of items) {
    if (item.isContainer) {
      containerLabels.set(item.assetId, item.customName ?? item.marketHashName);
    }
  }

  const run = db.transaction((batch: ResolvedItem[]) => {
    for (const item of batch) {
      const containerLabel = item.containerId ? containerLabels.get(item.containerId) : null;
      statement.run({
        asset_id: item.assetId,
        def_index: item.defIndex,
        paint_index: item.paintIndex,
        paint_seed: item.paintSeed,
        float_value: item.floatValue,
        quality: item.quality,
        rarity: item.rarity,
        market_hash_name: item.marketHashName,
        base_name: item.baseName,
        wear_name: item.wearName,
        rarity_name: item.rarityName,
        rarity_color: item.rarityColor,
        category: item.category,
        image_url: item.imageUrl,
        custom_name: item.customName,
        stattrak: item.stattrak ? 1 : 0,
        souvenir: item.souvenir ? 1 : 0,
        container_id: item.containerId,
        is_container: item.isContainer ? 1 : 0,
        contained_count: item.containedCount,
        stickers_json: item.stickers.length ? JSON.stringify(item.stickers) : null,
        keychain_json: item.keychain ? JSON.stringify(item.keychain) : null,
        tradable_after: item.tradableAfter,
        origin: item.origin,
        position: item.position,
        resolved: item.resolved ? 1 : 0,
        // Storing the container label makes "find everything in the unit I
        // called overpay" work with the same single query as a name search.
        search_text: searchKey(item.marketHashName, item.customName, containerLabel),
        seen_at: seenAt,
      });
    }
  });

  run(items);
}

export function markRemoved(db: Db, assetIds: string[], removedAt: string): void {
  if (assetIds.length === 0) return;
  const statement = db.prepare('UPDATE items SET removed_at = ? WHERE asset_id = ?');
  const run = db.transaction((ids: string[]) => {
    for (const id of ids) statement.run(removedAt, id);
  });
  run(assetIds);
}

export function recordEvents(db: Db, runId: number, ts: string, diff: InventoryDiff): void {
  const statement = db.prepare(
    `INSERT INTO events (ts, run_id, type, asset_id, market_hash_name, from_container, to_container)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const run = db.transaction(() => {
    for (const change of diff.added) {
      statement.run(ts, runId, 'added', change.assetId, change.marketHashName, null, change.toContainer);
    }
    for (const change of diff.removed) {
      statement.run(ts, runId, 'removed', change.assetId, change.marketHashName, change.fromContainer, null);
    }
    for (const change of diff.moved) {
      statement.run(
        ts,
        runId,
        'moved',
        change.assetId,
        change.marketHashName,
        change.fromContainer,
        change.toContainer,
      );
    }
  });
  run();
}

export interface SearchOptions {
  query?: string;
  containerId?: string | null;
  /** 'loose' restricts to items outside any storage unit. */
  location?: 'all' | 'loose' | 'stored';
  category?: string;
  rarity?: string;
  stattrak?: boolean;
  souvenir?: boolean;
  unresolvedOnly?: boolean;
  includeRemoved?: boolean;
  sort?: 'name' | 'float' | 'recent';
  limit?: number;
  offset?: number;
}

const SORTS: Record<NonNullable<SearchOptions['sort']>, string> = {
  name: 'market_hash_name ASC, float_value ASC',
  float: 'float_value IS NULL, float_value ASC',
  recent: 'first_seen DESC, market_hash_name ASC',
};

interface WhereClause {
  sql: string;
  params: Record<string, unknown>;
}

function buildWhere(options: SearchOptions): WhereClause {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (!options.includeRemoved) conditions.push('removed_at IS NULL');

  if (options.query && options.query.trim()) {
    // Every whitespace-separated word must appear somewhere in the item's
    // searchable text, so "kara fade" finds a Karambit | Fade.
    const words = searchKey(options.query).split(' ').filter(Boolean);
    words.forEach((word, i) => {
      conditions.push(`search_text LIKE @q${i}`);
      params[`q${i}`] = `%${word}%`;
    });
  }

  if (options.containerId !== undefined && options.containerId !== null) {
    conditions.push('container_id = @containerId');
    params.containerId = options.containerId;
  }

  if (options.location === 'loose') conditions.push('container_id IS NULL');
  if (options.location === 'stored') conditions.push('container_id IS NOT NULL');

  if (options.category) {
    conditions.push('category = @category');
    params.category = options.category;
  }
  if (options.rarity) {
    conditions.push('rarity_name = @rarity');
    params.rarity = options.rarity;
  }
  if (options.stattrak) conditions.push('stattrak = 1');
  if (options.souvenir) conditions.push('souvenir = 1');
  if (options.unresolvedOnly) conditions.push('resolved = 0');

  return {
    sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export interface SearchResult {
  total: number;
  items: ItemRow[];
}

export function searchItems(db: Db, options: SearchOptions = {}): SearchResult {
  const where = buildWhere(options);
  const order = SORTS[options.sort ?? 'name'];
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
  const offset = Math.max(options.offset ?? 0, 0);

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM items ${where.sql}`).get(where.params) as { n: number }
  ).n;

  const items = db
    .prepare(`SELECT * FROM items ${where.sql} ORDER BY ${order} LIMIT @limit OFFSET @offset`)
    .all({ ...where.params, limit, offset }) as ItemRow[];

  return { total, items };
}

/**
 * Storage units with both the count the game reports and the count we hold.
 * A gap between the two means enumeration was interrupted for that unit.
 */
export function listContainers(db: Db): ContainerRow[] {
  return db
    .prepare(
      `SELECT c.asset_id                                AS asset_id,
              COALESCE(NULLIF(c.custom_name, ''), 'Storage Unit') AS label,
              COALESCE(c.contained_count, 0)            AS contained_count,
              (SELECT COUNT(*) FROM items i
                WHERE i.container_id = c.asset_id AND i.removed_at IS NULL) AS stored_count
         FROM items c
        WHERE c.is_container = 1 AND c.removed_at IS NULL
        ORDER BY label COLLATE NOCASE ASC`,
    )
    .all() as ContainerRow[];
}

export interface Stats {
  totalItems: number;
  looseItems: number;
  storedItems: number;
  containers: number;
  unresolved: number;
  distinctNames: number;
  lastSyncAt: string | null;
}

export function getStats(db: Db): Stats {
  const row = db
    .prepare(
      `SELECT COUNT(*)                                            AS totalItems,
              SUM(CASE WHEN container_id IS NULL THEN 1 ELSE 0 END) AS looseItems,
              SUM(CASE WHEN container_id IS NOT NULL THEN 1 ELSE 0 END) AS storedItems,
              SUM(CASE WHEN is_container = 1 THEN 1 ELSE 0 END)    AS containers,
              SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END)        AS unresolved,
              COUNT(DISTINCT market_hash_name)                     AS distinctNames
         FROM items WHERE removed_at IS NULL`,
    )
    .get() as Record<string, number | null>;

  const lastSync = db
    .prepare(`SELECT finished_at FROM sync_runs WHERE status = 'ok' ORDER BY id DESC LIMIT 1`)
    .get() as { finished_at: string | null } | undefined;

  return {
    totalItems: row.totalItems ?? 0,
    looseItems: row.looseItems ?? 0,
    storedItems: row.storedItems ?? 0,
    containers: row.containers ?? 0,
    unresolved: row.unresolved ?? 0,
    distinctNames: row.distinctNames ?? 0,
    lastSyncAt: lastSync?.finished_at ?? null,
  };
}

/** Aggregated duplicates, so "how many of these do I own" is one lookup. */
export interface StackRow {
  market_hash_name: string;
  count: number;
  image_url: string | null;
  rarity_color: string | null;
  containers: number;
}

export function listStacks(db: Db, options: SearchOptions = {}): { total: number; rows: StackRow[] } {
  const where = buildWhere(options);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
  const offset = Math.max(options.offset ?? 0, 0);

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM (SELECT 1 FROM items ${where.sql} GROUP BY market_hash_name)`,
      )
      .get(where.params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT market_hash_name,
              COUNT(*)                                  AS count,
              MAX(image_url)                            AS image_url,
              MAX(rarity_color)                         AS rarity_color,
              COUNT(DISTINCT COALESCE(container_id, '')) AS containers
         FROM items ${where.sql}
        GROUP BY market_hash_name
        ORDER BY count DESC, market_hash_name ASC
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...where.params, limit, offset }) as StackRow[];

  return { total, rows };
}

export interface EventRow {
  id: number;
  ts: string;
  type: string;
  asset_id: string;
  market_hash_name: string | null;
  from_container: string | null;
  to_container: string | null;
}

export function recentEvents(db: Db, limit = 200): EventRow[] {
  return db
    .prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?')
    .all(Math.min(Math.max(limit, 1), 1000)) as EventRow[];
}

export function listFacets(db: Db): { categories: string[]; rarities: string[] } {
  const categories = db
    .prepare(
      `SELECT DISTINCT category FROM items
        WHERE removed_at IS NULL AND category IS NOT NULL
        ORDER BY category`,
    )
    .all() as { category: string }[];
  const rarities = db
    .prepare(
      `SELECT DISTINCT rarity_name FROM items
        WHERE removed_at IS NULL AND rarity_name IS NOT NULL
        ORDER BY rarity_name`,
    )
    .all() as { rarity_name: string }[];
  return {
    categories: categories.map((r) => r.category),
    rarities: rarities.map((r) => r.rarity_name),
  };
}

export function startSyncRun(db: Db, startedAt: string, steamId: string | null): number {
  const result = db
    .prepare(`INSERT INTO sync_runs (started_at, status, steam_id) VALUES (?, 'running', ?)`)
    .run(startedAt, steamId);
  return Number(result.lastInsertRowid);
}

export interface SyncRunSummary {
  totalItems: number;
  containers: number;
  added: number;
  removed: number;
  moved: number;
  unresolved: number;
}

export function finishSyncRun(
  db: Db,
  runId: number,
  finishedAt: string,
  summary: SyncRunSummary,
): void {
  db.prepare(
    `UPDATE sync_runs SET finished_at = ?, status = 'ok', total_items = ?, containers = ?,
            added = ?, removed = ?, moved = ?, unresolved = ?
      WHERE id = ?`,
  ).run(
    finishedAt,
    summary.totalItems,
    summary.containers,
    summary.added,
    summary.removed,
    summary.moved,
    summary.unresolved,
    runId,
  );
}

export function failSyncRun(db: Db, runId: number, finishedAt: string, error: string): void {
  db.prepare(`UPDATE sync_runs SET finished_at = ?, status = 'failed', error = ? WHERE id = ?`).run(
    finishedAt,
    error,
    runId,
  );
}
