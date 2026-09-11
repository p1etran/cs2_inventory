import { CmClient, removeOriginRule } from './steam/cm.js';
import { emsgName } from './steam/emsg.js';
import { NoSteamSessionError, readSteamSession } from './steam/session.js';

/**
 * Milestone 2a: prove the transport works end to end by logging on and
 * reporting who Steam says we are.
 *
 * Nothing here touches the game coordinator. If this page shows the right
 * account, then server selection, the Origin rule, message framing, protobuf
 * decoding, Multi inflation and the logon exchange are all correct, and
 * anything that goes wrong afterwards belongs to the game coordinator rather
 * than to the connection.
 */

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

function showAccount(name: string | null, steamId: string): void {
  accountEl.replaceChildren();
  const strong = document.createElement('b');
  strong.textContent = name ? `Signed in as ${name}` : 'Signed in';
  const detail = document.createElement('div');
  detail.className = 'dim';
  detail.textContent = steamId;
  accountEl.append(strong, detail);
}

async function connect(): Promise<void> {
  connectButton.disabled = true;
  logEl.textContent = '';
  logEl.className = '';
  accountEl.replaceChildren();

  const client = new CmClient({ onLog: (message) => write(message, 'dim') });

  try {
    const session = await readSteamSession();
    write(
      `Exchanged this browser's Steam session for a logon token${session.accountName ? ` (${session.accountName})` : ''}`,
      'ok',
    );
    write('No password, no Steam Guard code, and no cookie was read.', 'dim');

    await client.connect();
    const result = await client.logOn(session);

    write('', '');
    write(`Logged on as ${result.steamId}`, 'ok');
    if (result.personaName) write(`Persona name: ${result.personaName}`, 'ok');
    if (result.vanityUrl) write(`Vanity URL: ${result.vanityUrl}`, 'dim');
    write(`Cell: ${result.cellId}, heartbeat every ${result.heartbeatSeconds}s`, 'dim');
    showAccount(result.personaName, result.steamId);

    write('', '');
    write('Transport confirmed. Next milestone reads a storage unit.', 'ok');

    // Anything else Steam volunteers is worth seeing while this is young.
    for (const emsg of [768, 780, 798]) {
      client.on(emsg, (message) => write(`(also received ${emsgName(message.emsg)})`, 'dim'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    write('', '');
    write(message, 'bad');
    if (error instanceof NoSteamSessionError) {
      write('Sign in at steamcommunity.com with "Remember me" ticked, then retry.', 'dim');
    }
  } finally {
    connectButton.disabled = false;
  }
}

connectButton.addEventListener('click', () => void connect());

// Leave no rule behind once the page goes away.
window.addEventListener('pagehide', () => void removeOriginRule());
