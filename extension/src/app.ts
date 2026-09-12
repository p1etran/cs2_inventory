import { Catalog, readCasketId, type CatalogIndex } from '../../src/core.js';
import { signInWithQr } from './steam/auth.js';
import { CmClient, removeOriginRule } from './steam/cm.js';
import { GcClient, type GcEconItem } from './steam/gc.js';
import { machineId } from './steam/machineid.js';
import { forgetSession, inspectToken, loadSession, saveSession } from './steam/tokens.js';
import { Store } from './store.js';
import { runSync } from './sync.js';
import { CollapsingLog } from './ui/log.js';
import { renderQrSvg } from './ui/qr.js';

/**
 * The page: sign in, read the whole account, keep the index.
 *
 * Naming and reconciliation are not reimplemented here. `src/core.ts` is the
 * same code the local CLI uses, which is why item names in this page can be
 * compared directly against `node dist/cli.js containers` for the same
 * account -- the strongest correctness check available, since the Node path is
 * already known to be right.
 */

const logEl = document.getElementById('log') as HTMLPreElement;
const accountEl = document.getElementById('account') as HTMLDivElement;
const connectButton = document.getElementById('connect') as HTMLButtonElement;
const signOutButton = document.getElementById('signout') as HTMLButtonElement;
const signInEl = document.getElementById('signin') as HTMLDivElement;
const cancelButton = document.getElementById('cancel') as HTMLButtonElement;

const store = new Store();

const log = new CollapsingLog(logEl);

const write = (text: string, cls = ''): void => log.write(text, cls);
const clearLog = (): void => log.clear();

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
async function ensureSignedIn(
  cm: CmClient,
): Promise<{ refreshToken: string; steamId: string; accountName: string }> {
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
      return {
        refreshToken: saved.refreshToken,
        steamId: status.steamId,
        accountName: saved.accountName,
      };
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
  return {
    refreshToken: signedIn.refreshToken,
    steamId: status.steamId,
    accountName: signedIn.accountName,
  };
}

/** Logs on and reaches the GC, or throws. Leaves the connection open on success. */
async function reachGc(): Promise<{ client: CmClient; gc: GcClient; steamId: string }> {
  const client = new CmClient({ onLog: (message) => write(message, 'dim') });

  await client.connect();
  const { refreshToken, steamId, accountName } = await ensureSignedIn(client);

  const logon = await client.logOnWithToken(refreshToken, steamId, await machineId());
  // The persona name arrives separately and may not have landed yet, so fall
  // back to the account name the sign-in gave us rather than to the SteamID,
  // which is already shown underneath.
  showAccount(logon.personaName || accountName || logon.steamId, logon.steamId);
  write(`Logged on as ${logon.steamId}`, 'ok');
  signOutButton.hidden = false;

  const gc = new GcClient(client, { onLog: (message) => write(message, 'dim'), casketIdOf });
  try {
    await gc.connect();
  } catch (error) {
    client.disconnect();
    throw error;
  }
  return { client, gc, steamId: logon.steamId };
}

async function run(): Promise<void> {
  connectButton.disabled = true;
  clearLog();
  accountEl.replaceChildren();

  let client: CmClient | null = null;
  const controller = new AbortController();
  cancelButton.hidden = false;
  const onCancel = () => controller.abort();
  cancelButton.addEventListener('click', onCancel, { once: true });

  try {
    // Before anything else: without the previous index, every sync would diff
    // against nothing and report the entire inventory as newly added.
    await store.load();

    const reached = await reachGc();
    client = reached.client;
    const { gc, steamId } = reached;

    write('Loading the item schema so names can be resolved...', 'dim');
    const catalog = await loadCatalog();

    write('', '');
    const startedAt = Date.now();
    const summary = await runSync({
      gc,
      store,
      catalog,
      steamId,
      signal: controller.signal,
      onProgress: (message) => write(message, message.startsWith('  ') ? 'dim' : ''),
    });

    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    write('', '');
    write(
      `Indexed ${summary.totalItems} items across ${summary.containers.length} storage units in ${seconds}s`,
      'ok',
    );
    if (summary.added || summary.removed || summary.moved) {
      write(
        `${summary.added} added, ${summary.removed} removed, ${summary.moved} moved since last time`,
        '',
      );
    }
    if (summary.unresolved) {
      write(`${summary.unresolved} items could not be named from the schema`, 'dim');
    }

    // A unit that failed is the one thing worth showing loudly: its contents
    // are still in the index from last time, and saying nothing would let
    // stale data pass for fresh.
    if (summary.failedContainers) {
      write('', '');
      write(`${summary.failedContainers} storage units could not be read:`, 'bad');
      for (const container of summary.containers.filter((c) => c.error !== null)) {
        write(`  ${container.label}: ${container.error}`, 'dim');
      }
      write('Their previous contents were kept rather than reported as gone.', 'dim');
    }

    showSummary();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    write('', '');
    write(message, 'bad');
  } finally {
    cancelButton.removeEventListener('click', onCancel);
    cancelButton.hidden = true;
    hideQr();
    client?.disconnect();
    connectButton.disabled = false;
  }
}

/** Lists the units with both counts, so a short read is visible at a glance. */
function showSummary(): void {
  write('', '');
  for (const container of store.listContainers()) {
    const short = container.storedCount < container.containedCount;
    write(
      `  ${container.label.padEnd(18)} ${String(container.storedCount).padStart(5)}` +
        `${short ? ` of ${container.containedCount}` : ''}`,
      short ? 'bad' : 'dim',
    );
  }

  const stats = store.getStats();
  write('', '');
  write(
    `${stats.totalItems} items indexed: ${stats.looseItems} loose, ${stats.storedItems} in units`,
    'ok',
  );
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

