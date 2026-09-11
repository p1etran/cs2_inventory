#!/usr/bin/env node
import fs from 'node:fs/promises';
import { loadCatalog } from './catalog/store.js';
import { loadConfig, type Config } from './config.js';
import { openDatabase, type Db } from './db/database.js';
import {
  getStats,
  listContainers,
  recentEvents,
  searchItems,
  type ItemRow,
} from './db/repo.js';
import {
  collectExport,
  describeLocation,
  exportCsv,
  exportJson,
} from './export.js';
import { startServer } from './server/server.js';
import {
  clearSession,
  isSessionEncrypted,
  loadSession,
  saveSession,
  SessionLockedError,
} from './steam/credentials.js';
import { GcClient } from './steam/gc.js';
import { runSync } from './sync/sync.js';
import { log } from './util/log.js';
import { confirm, prompt, promptSecret } from './util/prompt.js';

const USAGE = `cs2inv - a local CS2 inventory index, storage units included

Usage: cs2inv <command> [options]

Commands:
  login              Sign in to Steam once and save a refresh token locally
  logout             Delete the saved Steam session
  sync               Read the whole inventory, storage units included
  find <query>       Search everything you own and show where each item is
  stats              Totals for the last sync
  containers         List storage units and how full they are
  changes            Show what moved, arrived or left since earlier syncs
  export             Write every item to CSV or JSON
  serve              Open the local web UI
  catalog            Refresh the cached item schema

Options:
  --data-dir <path>  Where the database and cache live (default ./data)
  --limit <n>        Row limit for find/changes/export
  --container <id>   Restrict to one storage unit
  --loose            Only items outside storage units
  --unresolved       Only items the item schema could not name
  --json             Machine-readable output
  --out <path>       Write export output to a file instead of stdout
  --port <n>         Port for serve (default 8733)
  --force            Redownload the item schema even if it is fresh
`;

interface Args {
  command: string;
  positional: string[];
  flags: Map<string, string | boolean>;
}

function parseArgs(argv: string[]): Args {
  const [command = 'help', ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i] as string;
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const name = token.slice(2);
    const next = rest[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(name, next);
      i += 1;
    } else {
      flags.set(name, true);
    }
  }
  return { command, positional, flags };
}

function flagString(args: Args, name: string): string | undefined {
  const value = args.flags.get(name);
  return typeof value === 'string' ? value : undefined;
}

function flagInt(args: Args, name: string, fallback: number): number {
  const value = flagString(args, name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function configFrom(args: Args): Config {
  const overrides: Partial<Config> = {};
  const dataDir = flagString(args, 'data-dir');
  if (dataDir) overrides.dataDir = dataDir;
  const port = flagString(args, 'port');
  if (port) overrides.port = Number.parseInt(port, 10);
  const passphrase = flagString(args, 'passphrase');
  if (passphrase) overrides.passphrase = passphrase;
  return loadConfig(overrides);
}

function withDb<T>(config: Config, fn: (db: Db) => T): T {
  const db = openDatabase(config.dbPath);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

async function commandLogin(config: Config): Promise<void> {
  const existing = await isSessionEncrypted(config.credentialsPath);
  if (existing !== null && !(await confirm('A saved session already exists. Replace it?'))) {
    return;
  }

  log.info('Your password is used once to get a Steam refresh token and is never stored.');
  const accountName = await prompt('Steam account name: ');
  const password = await promptSecret('Steam password: ');

  let passphrase = config.passphrase;
  if (!passphrase) {
    passphrase =
      (await promptSecret('Passphrase to encrypt the saved token (blank for none): ')) || null;
  }

  const gc = new GcClient({ dataDirectory: config.dataDir, onProgress: (m) => log.info(m) });
  try {
    const result = await gc.loginWithPassword({
      accountName,
      password,
      sharedSecret: config.sharedSecret,
      guardCodeProvider: async (domain) =>
        prompt(domain ? `Steam Guard code emailed to ${domain}: ` : 'Steam Guard code: '),
    });

    if (!result.refreshToken) {
      throw new Error('Steam did not return a refresh token; cannot save this session.');
    }

    await saveSession(
      config.credentialsPath,
      {
        steamId: result.steamId,
        accountName,
        refreshToken: result.refreshToken,
        savedAt: new Date().toISOString(),
      },
      passphrase,
    );

    log.info(`Signed in as ${result.steamId}.`);
    log.info(
      passphrase
        ? `Encrypted refresh token saved to ${config.credentialsPath}`
        : `Refresh token saved unencrypted (owner-only) to ${config.credentialsPath}`,
    );
    log.info('Run `cs2inv sync` next.');
  } finally {
    gc.disconnect();
  }
}

async function commandSync(config: Config, args: Args): Promise<void> {
  const session = await loadSession(config.credentialsPath, config.passphrase);
  if (!session) {
    log.error('No saved Steam session. Run `cs2inv login` first.');
    process.exitCode = 1;
    return;
  }

  const onProgress = (message: string) => log.info(message);
  const catalog = await loadCatalog({
    filePath: config.catalogPath,
    force: args.flags.has('force'),
    onProgress,
  });
  log.info(`item schema: ${catalog.skinCount} finishes, built ${catalog.builtAt}`);

  const db = openDatabase(config.dbPath);
  const gc = new GcClient({
    dataDirectory: config.dataDir,
    casketDelayMs: config.casketDelayMs,
    onProgress,
  });

  try {
    log.info('logging in to Steam');
    const { steamId } = await gc.loginWithRefreshToken(session.refreshToken);
    const summary = await runSync({ db, gc, catalog, steamId, onProgress });

    log.info('');
    log.info(`Total items:      ${summary.totalItems}`);
    log.info(`  loose:          ${summary.looseItems}`);
    log.info(`  in units:       ${summary.totalItems - summary.looseItems}`);
    log.info(`Storage units:    ${summary.containers.length}`);
    log.info(
      `Changes:          +${summary.diff.added.length} / -${summary.diff.removed.length} / moved ${summary.diff.moved.length}`,
    );

    const short = summary.containers.filter((c) => !c.error && c.read < c.expected);
    for (const container of short) {
      log.warn(`${container.label}: read ${container.read} of ${container.expected} items`);
    }
    for (const container of summary.containers.filter((c) => c.error)) {
      log.error(`${container.label}: ${container.error}`);
    }
    if (summary.unresolved > 0) {
      log.warn(
        `${summary.unresolved} items could not be named. Run \`cs2inv catalog --force\` to refresh the schema.`,
      );
    }
    if (summary.failedContainers > 0) {
      process.exitCode = 1;
    }
  } finally {
    gc.disconnect();
    db.close();
  }
}

function commandFind(config: Config, args: Args): void {
  const query = args.positional.join(' ');
  const limit = flagInt(args, 'limit', 50);

  withDb(config, (db) => {
    const containerLabels = new Map(listContainers(db).map((c) => [c.asset_id, c.label]));
    const result = searchItems(db, {
      query,
      containerId: flagString(args, 'container') ?? null,
      location: args.flags.has('loose') ? 'loose' : 'all',
      unresolvedOnly: args.flags.has('unresolved'),
      limit,
    });

    if (args.flags.has('json')) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }

    if (result.total === 0) {
      log.info(`No items match "${query}".`);
      return;
    }

    for (const row of result.items) {
      const floatText = row.float_value === null ? '' : `  ${row.float_value.toFixed(6)}`;
      process.stdout.write(
        `${row.market_hash_name}${floatText}\n    in ${describeLocation(row, containerLabels)}\n`,
      );
    }
    if (result.total > result.items.length) {
      log.info(`... ${result.total - result.items.length} more (use --limit)`);
    }
  });
}

function commandStats(config: Config, args: Args): void {
  withDb(config, (db) => {
    const stats = getStats(db);
    if (args.flags.has('json')) {
      process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
      return;
    }
    process.stdout.write(
      [
        `Items:            ${stats.totalItems}`,
        `  loose:          ${stats.looseItems}`,
        `  in units:       ${stats.storedItems}`,
        `Distinct names:   ${stats.distinctNames}`,
        `Storage units:    ${stats.containers}`,
        `Unnamed items:    ${stats.unresolved}`,
        `Last sync:        ${stats.lastSyncAt ?? 'never'}`,
        '',
      ].join('\n'),
    );
  });
}

function commandContainers(config: Config, args: Args): void {
  withDb(config, (db) => {
    const containers = listContainers(db);
    if (args.flags.has('json')) {
      process.stdout.write(`${JSON.stringify(containers, null, 2)}\n`);
      return;
    }
    if (containers.length === 0) {
      log.info('No storage units found. Run `cs2inv sync` first.');
      return;
    }
    for (const container of containers) {
      const gap = container.contained_count - container.stored_count;
      const note = gap > 0 ? `  (${gap} not yet read)` : '';
      process.stdout.write(
        `${String(container.stored_count).padStart(4)} / ${String(container.contained_count).padEnd(4)}  ${container.label}${note}\n`,
      );
    }
  });
}

function commandChanges(config: Config, args: Args): void {
  withDb(config, (db) => {
    const events = recentEvents(db, flagInt(args, 'limit', 50));
    if (args.flags.has('json')) {
      process.stdout.write(`${JSON.stringify(events, null, 2)}\n`);
      return;
    }
    const labels = new Map(listContainers(db).map((c) => [c.asset_id, c.label]));
    const place = (id: string | null) => (id ? labels.get(id) ?? `unit ${id}` : 'inventory');

    for (const event of events) {
      const where =
        event.type === 'moved'
          ? `${place(event.from_container)} -> ${place(event.to_container)}`
          : place(event.type === 'removed' ? event.from_container : event.to_container);
      process.stdout.write(
        `${event.ts.slice(0, 19)}  ${event.type.padEnd(7)} ${event.market_hash_name ?? event.asset_id}  [${where}]\n`,
      );
    }
  });
}

async function commandExport(config: Config, args: Args): Promise<void> {
  const data = withDb(config, (db) => collectExport(db));
  const output = args.flags.has('json') ? exportJson(data) : exportCsv(data);

  const outPath = flagString(args, 'out');
  if (outPath) {
    await fs.writeFile(outPath, output, 'utf8');
    log.info(`Wrote ${data.items.length} items to ${outPath}`);
  } else {
    process.stdout.write(output);
  }
}

async function commandCatalog(config: Config, args: Args): Promise<void> {
  const catalog = await loadCatalog({
    filePath: config.catalogPath,
    force: args.flags.has('force'),
    onProgress: (message) => log.info(message),
  });
  log.info(`item schema ready: ${catalog.skinCount} finishes, built ${catalog.builtAt}`);
}

async function commandServe(config: Config): Promise<void> {
  const db = openDatabase(config.dbPath);
  const server = await startServer(db, config);
  log.info(`CS2 inventory UI at ${server.url}`);
  log.info('Bound to loopback only. Press Ctrl+C to stop.');

  const shutdown = () => {
    void server.close().then(() => {
      db.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = configFrom(args);

  switch (args.command) {
    case 'login':
      await commandLogin(config);
      break;
    case 'logout':
      await clearSession(config.credentialsPath);
      log.info('Saved Steam session deleted.');
      break;
    case 'sync':
      await commandSync(config, args);
      break;
    case 'find':
      commandFind(config, args);
      break;
    case 'stats':
      commandStats(config, args);
      break;
    case 'containers':
      commandContainers(config, args);
      break;
    case 'changes':
      commandChanges(config, args);
      break;
    case 'export':
      await commandExport(config, args);
      break;
    case 'catalog':
      await commandCatalog(config, args);
      break;
    case 'serve':
      await commandServe(config);
      break;
    default:
      process.stdout.write(USAGE);
      if (args.command !== 'help') process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  if (error instanceof SessionLockedError) {
    log.error(error.message);
  } else {
    log.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});
