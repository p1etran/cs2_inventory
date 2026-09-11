/**
 * Feasibility spike for running the CS2 inventory reader as a browser
 * extension. It answers the two questions the whole approach rests on, and
 * nothing else:
 *
 *   1. Is a usable Steam refresh token readable from this browser's session?
 *      If yes, signing in needs no password and no Steam Guard code.
 *   2. Will Steam's CM servers accept a WebSocket from an extension origin?
 *      RFC 6455 leaves origin checking to the server, so this must be tested
 *      rather than assumed.
 *
 * Deliberately read-only: it opens a socket and closes it again without
 * sending a single byte of protocol, and it never prints a token. Only claim
 * metadata (issuer, account id, expiry) is shown.
 */

const logEl = document.getElementById('log');
const runButton = document.getElementById('run');
const copyButton = document.getElementById('copy');

const lines = [];

function write(text, cls = '') {
  lines.push(text);
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = `${text}\n`;
  logEl.append(span);
  logEl.scrollTop = logEl.scrollHeight;
}

const ok = (t) => write(`  PASS  ${t}`, 'ok');
const bad = (t) => write(`  FAIL  ${t}`, 'bad');
const warn = (t) => write(`  WARN  ${t}`, 'warn');
const note = (t) => write(`        ${t}`, 'dim');
const heading = (t) => write(`\n${t}`);

/** Reads one cookie, including httpOnly ones, which only an extension can do. */
function getCookie(url, name) {
  return new Promise((resolve) => {
    chrome.cookies.get({ url, name }, (cookie) => resolve(cookie || null));
  });
}

/**
 * Decodes a JWT's claims. Steam refresh tokens are JWTs whose payload names
 * the issuer, the account, and the expiry.
 */
function decodeClaims(jwt) {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Steam packs these cookies as "<steamid>||<token>". */
function splitSteamCookie(value) {
  const decoded = decodeURIComponent(value);
  const separator = decoded.indexOf('||');
  if (separator === -1) return { steamId: null, token: decoded };
  return { steamId: decoded.slice(0, separator), token: decoded.slice(separator + 2) };
}

async function checkLoggedIn() {
  heading('1. Steam session in this browser');

  const cookie = await getCookie('https://steamcommunity.com', 'steamLoginSecure');
  if (!cookie) {
    bad('No steamLoginSecure cookie on steamcommunity.com.');
    note('Log in at steamcommunity.com in this browser, then run this again.');
    return null;
  }

  const { steamId } = splitSteamCookie(cookie.value);
  ok(`Logged in to Steam Community${steamId ? ` as ${steamId}` : ''}.`);
  return steamId;
}

/**
 * The decisive auth check. A "remember me" login is expected to leave a
 * long-lived refresh token on login.steampowered.com. Only a refresh token
 * (issuer "steam") is accepted for a client login; the web access token in
 * steamLoginSecure is not.
 */
async function checkRefreshToken() {
  heading('2. Refresh token (this is what replaces the password)');

  const candidates = [
    ['https://login.steampowered.com', 'steamRefresh_steam'],
    ['https://steamcommunity.com', 'steamRefresh_steam'],
  ];

  for (const [url, name] of candidates) {
    const cookie = await getCookie(url, name);
    if (!cookie) continue;

    const { steamId, token } = splitSteamCookie(cookie.value);
    const claims = decodeClaims(token);
    if (!claims) {
      warn(`Found ${name} on ${new URL(url).host} but its claims did not decode.`);
      continue;
    }

    note(`Found ${name} on ${new URL(url).host}.`);
    note(`issuer: ${claims.iss ?? '(none)'}   account: ${claims.sub ?? steamId ?? '(none)'}`);
    if (claims.exp) {
      const expires = new Date(claims.exp * 1000);
      const days = Math.round((expires - Date.now()) / 86400000);
      note(`expires: ${expires.toISOString().slice(0, 10)} (${days} days)`);
    }

    if (claims.iss === 'steam') {
      ok('This is a usable Steam refresh token. No password needed.');
      return true;
    }
    warn(`Issuer is "${claims.iss}", not "steam", so a client login would reject it.`);
  }

  bad('No usable refresh token found.');
  note('Most likely cause: you did not tick "Remember me" when logging in to Steam.');
  note('Fix: sign out of Steam in this browser, sign in again with "Remember me"');
  note('ticked, then run this check again.');
  note('If it still fails, the fallback is a QR-code sign-in through the Steam');
  note('mobile app, which also needs no password.');
  return false;
}

/** Steam publishes its WebSocket-capable CM servers through this directory. */
async function fetchCmServers() {
  heading('3. Steam CM server list');

  const url =
    'https://api.steampowered.com/ISteamDirectory/GetCMListForConnect/v1/?cellid=0&cmtype=websockets';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      bad(`Directory returned HTTP ${response.status}.`);
      return [];
    }
    const body = await response.json();
    const servers = (body?.response?.serverlist ?? [])
      .map((entry) => entry.endpoint)
      .filter(Boolean);

    if (servers.length === 0) {
      bad('Directory replied but listed no WebSocket servers.');
      return [];
    }
    ok(`${servers.length} WebSocket CM servers listed.`);
    note(`first few: ${servers.slice(0, 3).join(', ')}`);
    return servers;
  } catch (error) {
    bad(`Could not reach the directory: ${error.message}`);
    return [];
  }
}

/**
 * Opens a CM socket and closes it immediately. No protocol is spoken. This is
 * purely to learn whether Steam accepts the handshake from an extension
 * origin, which is the one thing that cannot be established from
 * documentation.
 */
function tryWebSocket(endpoint) {
  return new Promise((resolve) => {
    const url = `wss://${endpoint}/cmsocket/`;
    let socket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      resolve({ opened: false, detail: error.message });
      return;
    }

    const timer = setTimeout(() => {
      socket.close();
      resolve({ opened: false, detail: 'timed out after 10s' });
    }, 10000);

    socket.onopen = () => {
      clearTimeout(timer);
      socket.close(1000);
      resolve({ opened: true, detail: null });
    };

    socket.onclose = (event) => {
      clearTimeout(timer);
      resolve({ opened: false, detail: `closed with code ${event.code}` });
    };

    socket.onerror = () => {
      // onclose always follows, and carries the more useful code.
    };
  });
}

async function checkWebSocket(servers) {
  heading('4. WebSocket handshake from this extension');

  if (servers.length === 0) {
    warn('Skipped: no server list to try.');
    return false;
  }

  note(`Extension origin: ${location.origin}`);

  for (const endpoint of servers.slice(0, 3)) {
    const { opened, detail } = await tryWebSocket(endpoint);
    if (opened) {
      ok(`Steam accepted a WebSocket from this extension (${endpoint}).`);
      return true;
    }
    warn(`${endpoint}: ${detail}`);
  }

  bad('No CM server accepted a WebSocket from this extension.');
  note('If every attempt closed immediately, Steam may be rejecting the');
  note('extension origin, which would rule out the browser approach.');
  return false;
}

function verdict(results) {
  heading('Verdict');
  if (results.token && results.socket) {
    write('  Both gates pass. The extension approach is viable:', 'ok');
    write('  no password, no Steam Guard code, and no server of ours.', 'ok');
    return;
  }
  if (!results.token && !results.socket) {
    write('  Both gates failed. Send me this report before anything is built.', 'bad');
    return;
  }
  write(`  Mixed result: token ${results.token ? 'OK' : 'FAILED'}, socket ${results.socket ? 'OK' : 'FAILED'}.`, 'warn');
  write('  Send me this report and I will work out what it means.', 'warn');
}

async function run() {
  runButton.disabled = true;
  lines.length = 0;
  logEl.textContent = '';
  logEl.className = '';

  try {
    await checkLoggedIn();
    const token = await checkRefreshToken();
    const servers = await fetchCmServers();
    const socket = await checkWebSocket(servers);
    verdict({ token, socket });
  } catch (error) {
    bad(`Unexpected failure: ${error.message}`);
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener('click', run);
copyButton.addEventListener('click', () => {
  void navigator.clipboard.writeText(lines.join('\n'));
  copyButton.textContent = 'Copied';
  setTimeout(() => {
    copyButton.textContent = 'Copy report';
  }, 1200);
});
