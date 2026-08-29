import path from 'node:path';

export interface Config {
  dataDir: string;
  dbPath: string;
  catalogPath: string;
  credentialsPath: string;
  port: number;
  /** Pause between storage-unit reads, to stay under the GC's rate limit. */
  casketDelayMs: number;
  passphrase: string | null;
  sharedSecret: string | null;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const dataDir = path.resolve(overrides.dataDir ?? process.env.CS2INV_DATA_DIR ?? './data');
  return {
    dataDir,
    dbPath: path.join(dataDir, 'inventory.db'),
    catalogPath: path.join(dataDir, 'catalog.json'),
    credentialsPath: path.join(dataDir, 'steam-session.json'),
    port: intFromEnv('CS2INV_PORT', 8733),
    casketDelayMs: intFromEnv('CS2INV_CASKET_DELAY_MS', 1100),
    passphrase: process.env.CS2INV_PASSPHRASE || null,
    sharedSecret: process.env.STEAM_SHARED_SECRET || null,
    ...overrides,
  };
}
