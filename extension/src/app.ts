import { Catalog, normalizeEconItem, readCasketId, type CatalogIndex } from '../../src/core.js';
import { CLIENT_OS_WEB, CmClient, UI_MODE_WEB, removeOriginRule } from './steam/cm.js';
import { GcClient, type GcEconItem } from './steam/gc.js';
import { NoSteamSessionError, readSteamSession } from './steam/session.js';

/**
 * Milestone 2b: reach the game coordinator and read one storage unit.
 *
 * The naming is not reimplemented here. `src/core.ts` is the same code the
 * local CLI uses, which is why the item names in this page can be compared
 * directly against `node dist/cli.js containers` for the same account -- and
 * that comparison is the strongest correctness check available, because the
 * Node path is already known to be right.
 */

const SCHEMA_URL =
  'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';

const logEl = document.getElementById('log') as HTMLPreElement;
const accountEl = document.getElementById('account') as HTMLDivElement;
const connectButton = document.getElementById('connect') as HTMLButtonElement;

function write(text: string, cls = ''): void {
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = `${text}\n`;
  logEl.append(span);
  logEl.scrollTop = logEl.scrollHeight;
}

function showAccount(name: string, steamId: string): void {
  accountEl.replaceChildren();
  const strong = document.createElement('b');
  strong.textContent = `Signed in as ${name}`;
  const detail = document.createElement('div');
  detail.className = 'dim';
  detail.textContent = steamId;
  accountEl.append(strong, detail);
}

/**
 * Loads the item schema and builds a catalog.
 *
 * Only the skins file is fetched for this milestone: it is the one that needs
 * the weapon-and-paint pairing, and it keeps the first run quick. A full sync
 * will want the other families too.
 */
async function loadCatalog(): Promise<Catalog> {
  const { buildCatalogIndex } = await import('../../src/core.js');
  const index = await buildCatalogIndex({
    onProgress: (message) => write(message, 'dim'),
    fetcher: async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.json();
    },
  });
  return new Catalog(index as CatalogIndex);
}

/** The storage unit an item sits in, read straight off its attributes. */
function casketIdOf(item: GcEconItem): string | null {
  return readCasketId(item.attribute);
}

function describeUnit(item: GcEconItem, catalog: Catalog): string {
  const resolved = catalog.resolve(normalizeEconItem(item));
  const label = resolved.customName ?? 'Storage Unit';
  return `${label} (${resolved.containedCount ?? 0} items, id ${resolved.assetId})`;
}

/**
 * The logon identifies this client as a web one, and has to.
 *
 * Measured, not assumed: a web logon token offered with a desktop OS type and
 * no UI mode is refused with `InvalidPassword`, while the web pairing
 * steam-user uses logs on fine. So the token and the identity go together, and
 * the desktop variant is not a fallback worth spending a logon on.
 *
 * This also settles a question that was open for two rounds: a web-mode session
 * *is* allowed to play a game. Steam confirms the game slot as app 730, and the
 * coordinator does reply. Whatever is wrong is past that point.
 */
const WEB_IDENTITY = { clientOsType: CLIENT_OS_WEB, uiMode: UI_MODE_WEB };

/** Logs on and reaches the GC, or throws. Leaves the connection open on success. */
async function reachGc(
  session: Awaited<ReturnType<typeof readSteamSession>>,
): Promise<{ client: CmClient; gc: GcClient }> {
  const client = new CmClient({
    onLog: (message) => write(message, 'dim'),
    clientIdentity: WEB_IDENTITY,
  });

  await client.connect();
  const logon = await client.logOn(session);
  showAccount(session.accountName || logon.steamId, logon.steamId);
  write(`Logged on as ${logon.steamId}`, 'ok');

  const gc = new GcClient(client, { onLog: (message) => write(message, 'dim'), casketIdOf });
  try {
    await gc.connect();
  } catch (error) {
    client.disconnect();
    throw error;
  }
  return { client, gc };
}

async function run(): Promise<void> {
  connectButton.disabled = true;
  logEl.textContent = '';
  logEl.className = '';
  accountEl.replaceChildren();

  let client: CmClient | null = null;

  try {
    const session = await readSteamSession();
    write(`Exchanged this browser's Steam session for a logon token`, 'ok');
    write('No password, no Steam Guard code, and no cookie was read.', 'dim');

    const reached = await reachGc(session);
    client = reached.client;
    const { gc } = reached;

    const units = gc.storageUnits;
    write('', '');
    write(`${gc.items.length} items in the inventory, ${units.length} storage units`, 'ok');

    if (units.length === 0) {
      write('No storage units on this account, so there is nothing to read.', 'dim');
      return;
    }

    write('Loading the item schema so names can be resolved...', 'dim');
    const catalog = await loadCatalog();

    write('', '');
    for (const unit of units) {
      write(`  ${describeUnit(unit, catalog)}`, 'dim');
    }

    // Read the fullest unit: it is the most convincing thing to check against
    // the CLI, and the most likely to expose a paging problem if one exists.
    const target = [...units].sort((a, b) => {
      const count = (item: GcEconItem) => normalizeEconItem(item).containedCount ?? 0;
      return count(b) - count(a);
    })[0];
    if (!target?.id) return;

    const label = normalizeEconItem(target).customName ?? 'Storage Unit';
    write('', '');
    write(`Reading "${label}"...`, '');
    const startedAt = Date.now();
    await gc.loadStorageUnit(target.id);

    const contents = gc.itemsIn(target.id);
    const expected = normalizeEconItem(target).containedCount ?? 0;
    write(
      `Read ${contents.length} of ${expected} items in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
      contents.length === expected ? 'ok' : 'bad',
    );

    write('', '');
    for (const item of contents.slice(0, 25)) {
      const resolved = catalog.resolve(normalizeEconItem(item));
      const float =
        resolved.floatValue === null ? '' : `  ${resolved.floatValue.toFixed(6)}`;
      write(`  ${resolved.marketHashName}${float}`, resolved.resolved ? '' : 'bad');
    }
    if (contents.length > 25) write(`  ... and ${contents.length - 25} more`, 'dim');

    write('', '');
    write(
      `Cross-check: \`node dist/cli.js containers\` should report ${expected} for "${label}".`,
      'ok',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    write('', '');
    write(message, 'bad');
    if (error instanceof NoSteamSessionError) {
      write('Open steamcommunity.com, sign in, then try again.', 'dim');
    }
  } finally {
    client?.disconnect();
    connectButton.disabled = false;
  }
}

connectButton.addEventListener('click', () => void run());

// Leave no rule behind once the page goes away.
window.addEventListener('pagehide', () => void removeOriginRule());

export { SCHEMA_URL };
