export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  asset_id         TEXT PRIMARY KEY,
  def_index        INTEGER NOT NULL,
  paint_index      INTEGER,
  paint_seed       INTEGER,
  float_value      REAL,
  quality          INTEGER NOT NULL DEFAULT 0,
  rarity           INTEGER NOT NULL DEFAULT 0,
  market_hash_name TEXT NOT NULL,
  base_name        TEXT NOT NULL,
  wear_name        TEXT,
  rarity_name      TEXT,
  rarity_color     TEXT,
  category         TEXT,
  image_url        TEXT,
  custom_name      TEXT,
  stattrak         INTEGER NOT NULL DEFAULT 0,
  souvenir         INTEGER NOT NULL DEFAULT 0,
  container_id     TEXT,
  is_container     INTEGER NOT NULL DEFAULT 0,
  contained_count  INTEGER,
  stickers_json    TEXT,
  keychain_json    TEXT,
  tradable_after   TEXT,
  origin           INTEGER,
  position         INTEGER,
  resolved         INTEGER NOT NULL DEFAULT 1,
  search_text      TEXT NOT NULL DEFAULT '',
  first_seen       TEXT NOT NULL,
  last_seen        TEXT NOT NULL,
  removed_at       TEXT
);

CREATE INDEX IF NOT EXISTS items_container_idx ON items (container_id);
CREATE INDEX IF NOT EXISTS items_name_idx      ON items (market_hash_name);
CREATE INDEX IF NOT EXISTS items_live_idx      ON items (removed_at);
CREATE INDEX IF NOT EXISTS items_search_idx    ON items (search_text);

CREATE TABLE IF NOT EXISTS sync_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  status        TEXT NOT NULL,
  steam_id      TEXT,
  total_items   INTEGER,
  containers    INTEGER,
  added         INTEGER,
  removed       INTEGER,
  moved         INTEGER,
  unresolved    INTEGER,
  error         TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  ts               TEXT NOT NULL,
  run_id           INTEGER REFERENCES sync_runs (id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  asset_id         TEXT NOT NULL,
  market_hash_name TEXT,
  from_container   TEXT,
  to_container     TEXT
);

CREATE INDEX IF NOT EXISTS events_ts_idx  ON events (ts DESC);
CREATE INDEX IF NOT EXISTS events_run_idx ON events (run_id);
`;
