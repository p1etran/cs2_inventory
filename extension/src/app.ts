import { Catalog, normalizeEconItem, readCasketId, type CatalogIndex } from '../../src/core.js';
import { signInWithQr } from './steam/auth.js';
import { CmClient, removeOriginRule } from './steam/cm.js';
import { GcClient, type GcEconItem } from './steam/gc.js';
import { machineId } from './steam/machineid.js';
import { forgetSession, inspectToken, loadSession, saveSession } from './steam/tokens.js';
import { renderQrSvg } from './ui/qr.js';

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
const signOutButton = document.getElementById('signout') as HTMLButtonElement;
const signInEl = document.getElementById('signin') as HTMLDivElement;

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

/** Shows the QR code and what to do with it. */
function showQr(challengeUrl: string): void {
  signInEl.hidden = false;
  signInEl.replaceChildren();

  const frame = document.createElement('div');
  frame.id = 'qr';
  frame.append(renderQrSvg(challengeUrl));

  const steps = document.createElement('ol');
  steps.className = 'steps';
  for (const step of [
    'Open the Steam app on your phone.',
    'Tap the Steam Guard shield, then the QR scanner.',
    'Scan this code and approve the sign-in.',
  ]) {
    const item = document.createElement('li');
    item.textContent = step;
    steps.append(item);
  }

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent =
    'Scanning signs you in on this device only. Steam never shows us your password, ' +
    'and the sign-in is stored in this browser profile — never sent anywhere but Steam. ' +
    'You only need to do this again when it expires, not on every visit.';

  signInEl.append(frame, steps, note);
}

function hideQr(): void {
  signInEl.hidden = true;
  signInEl.replaceChildren();
}

/**
 * Returns a usable client refresh token, signing in by QR if there isn't one.
 *
 * A QR scan is the cheapest sign-in Steam offers that yields a client-audience
 * token, and that audience is not optional: measured against the real
 * coordinator, a session built from the browser's own Steam cookies logs on
 * and is even granted the game slot, and CS2 still answers `NO_SESSION` to
 * every hello. There is no API to widen a token's audience, so this is the
 * floor, not a shortcut we failed to avoid.
 */
async function ensureSignedIn(cm: CmClient): Promise<{ refreshToken: string; steamId: string }> {
  const saved = await loadSession();
  if (saved) {
    const status = inspectToken(saved.refreshToken);
    if (status.usable && status.steamId) {
      const days = status.expiresAt
        ? Math.round((status.expiresAt.getTime() - Date.now()) / 86_400_000)
        : null;
      write(
        `Using the saved sign-in for ${saved.accountName || status.steamId}` +
          `${days === null ? '' : ` (${days} days left)`}`,
        'ok',
      );
      return { refreshToken: saved.refreshToken, steamId: status.steamId };
    }
    write(`Signing in again: ${status.problem}`, 'dim');
  }

  write('Scan the QR code with the Steam app on your phone.', '');
  cm.sayHello();

  const signedIn = await signInWithQr(cm, {
    onChallenge: (url) => showQr(url),
    onScanned: () => write('Scanned. Approve it on your phone.', 'dim'),
  });
  hideQr();

  const status = inspectToken(signedIn.refreshToken);
  if (!status.usable || !status.steamId) {
    throw new Error(`Steam returned a sign-in we cannot use: ${status.problem}`);
  }

  await saveSession({ refreshToken: signedIn.refreshToken, accountName: signedIn.accountName });
  write(`Signed in as ${signedIn.accountName || status.steamId}`, 'ok');
  return { refreshToken: signedIn.refreshToken, steamId: status.steamId };
}

/** Logs on and reaches the GC, or throws. Leaves the connection open on success. */
async function reachGc(): Promise<{ client: CmClient; gc: GcClient }> {
  const client = new CmClient({ onLog: (message) => write(message, 'dim') });

  await client.connect();
  const { refreshToken, steamId } = await ensureSignedIn(client);

  const logon = await client.logOnWithToken(refreshToken, steamId, await machineId());
  showAccount(logon.personaName ?? logon.steamId, logon.steamId);
  write(`Logged on as ${logon.steamId}`, 'ok');
  signOutButton.hidden = false;

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
    const reached = await reachGc();
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
  } finally {
    hideQr();
    client?.disconnect();
    connectButton.disabled = false;
  }
}

connectButton.addEventListener('click', () => void run());

signOutButton.addEventListener('click', () => {
  void forgetSession().then(() => {
    signOutButton.hidden = true;
    accountEl.replaceChildren();
    write('Sign-in forgotten. The next read will show a new QR code.', 'dim');
  });
});

// Offer to forget a sign-in that is already saved, before any connection.
void loadSession().then((saved) => {
  if (saved) signOutButton.hidden = false;
});

// Leave no rule behind once the page goes away.
window.addEventListener('pagehide', () => void removeOriginRule());

export { SCHEMA_URL };
