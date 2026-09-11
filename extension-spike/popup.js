/**
 * Feasibility spike for running the CS2 inventory reader as a browser
 * extension. It answers the questions the whole approach rests on:
 *
 *   1. Is a usable Steam refresh token readable from this browser's session?
 *      If yes, signing in needs no password and no Steam Guard code.
 *   2. Will Steam's CM servers accept a WebSocket from an extension origin?
 *      RFC 6455 leaves origin checking to the server, so this must be tested.
 *
 * Deliberately read-only: it opens sockets and closes them again without
 * sending a single byte of protocol, and it never prints a token. Only claim
 * metadata (issuer, account id, expiry) is shown.
 *
 * The first revision of this spike got question 2 wrong. It read each server's
 * `endpoint` and ignored the rest of the record, so it fed TCP endpoints to a
 * wss:// URL and read the resulting failures as a rejection. Selection now
 * matches what a real client does, and a control connection to a known-good
 * host distinguishes "Steam refused us" from "the connection never had a
 * chance".
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
 * The decisive auth check. A "remember me" login leaves a long-lived refresh
 * token on login.steampowered.com. Only a token issued by "steam" is accepted
 * for a client login; the web access token in steamLoginSecure is not.
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
  return false;
}

function tally(items, key) {
  const counts = new Map();
  for (const item of items) {
    const value = item[key] ?? '(none)';
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([value, n]) => `${value}=${n}`).join('  ');
}

/**
 * Steam publishes its CM servers through this directory. The list mixes
 * transports, so the records have to be filtered the way a real client does:
 * realm "steamglobal", type "websockets", and — for anything that can only
 * make ordinary HTTPS-shaped connections, which includes a browser — port 443.
 * That last rule is steam-user's `webCompatibilityMode`.
 */
async function fetchCmServers() {
  heading('3. Steam CM server list');

  const url =
    'https://api.steampowered.com/ISteamDirectory/GetCMListForConnect/v1/?cellid=0&cmtype=websockets';

  let servers;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      bad(`Directory returned HTTP ${response.status}.`);
      return [];
    }
    const body = await response.json();
    const raw = body?.response?.serverlist ?? [];
    servers = Array.isArray(raw) ? raw : Object.values(raw);
  } catch (error) {
    bad(`Could not reach the directory: ${error.message}`);
    return [];
  }

  if (servers.length === 0) {
    bad('Directory replied but listed no servers.');
    return [];
  }

  ok(`${servers.length} servers listed.`);
  note(`by type:  ${tally(servers, 'type')}`);
  note(`by realm: ${tally(servers, 'realm')}`);

  const sample = servers[0];
  if (sample) note(`sample record: ${JSON.stringify(sample)}`);

  const websockets = servers.filter(
    (s) => s.realm === 'steamglobal' && s.type === 'websockets' && s.endpoint,
  );
  const on443 = websockets.filter((s) => s.endpoint.endsWith(':443'));

  note(`steamglobal websockets: ${websockets.length}, of those on :443: ${on443.length}`);

  if (websockets.length === 0) {
    bad('No steamglobal WebSocket servers in the list.');
    note('The previous run failed because it ignored these fields and tried');
    note('TCP endpoints instead.');
    return [];
  }

  // Prefer 443, but keep the rest as a fallback so the report shows whether
  // the port is what matters.
  const ordered = [...on443, ...websockets.filter((s) => !s.endpoint.endsWith(':443'))];
  note(`will try: ${ordered.slice(0, 4).map((s) => s.endpoint).join(', ')}`);
  return ordered.map((s) => s.endpoint);
}

/**
 * Opens a socket and closes it immediately. No protocol is spoken. Timing
 * matters: an instant close and a timeout mean different things.
 */
function tryWebSocket(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const elapsed = () => `${Date.now() - startedAt}ms`;

    let socket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      resolve({ opened: false, detail: `refused to construct: ${error.message}` });
      return;
    }

    const timer = setTimeout(() => {
      socket.close();
      resolve({ opened: false, detail: `no response, timed out after ${elapsed()}` });
    }, timeoutMs);

    socket.onopen = () => {
      clearTimeout(timer);
      const detail = `opened in ${elapsed()}`;
      socket.close(1000);
      resolve({ opened: true, detail });
    };

    socket.onclose = (event) => {
      clearTimeout(timer);
      resolve({ opened: false, detail: `closed with code ${event.code} after ${elapsed()}` });
    };

    socket.onerror = () => {
      // onclose always follows and carries the more useful code.
    };
  });
}

/**
 * Control test. Without this, a Steam failure cannot be told apart from
 * WebSockets simply not working from an extension page — which is exactly the
 * ambiguity that made the previous run inconclusive.
 */
async function checkControl() {
  heading('4. Control: can this extension open any WebSocket at all?');
  note(`Extension origin: ${location.origin}`);

  const controls = ['wss://ws.postman-echo.com/raw', 'wss://echo.websocket.org'];

  for (const url of controls) {
    const { opened, detail } = await tryWebSocket(url);
    if (opened) {
      ok(`WebSockets work from this extension (${new URL(url).host}, ${detail}).`);
      return true;
    }
    warn(`${new URL(url).host}: ${detail}`);
  }

  bad('No control WebSocket opened either.');
  note('So a Steam failure below would not prove anything about Steam — check');
  note('for a firewall, proxy or VPN blocking WebSocket traffic.');
  return false;
}

async function checkSteamWebSocket(endpoints, controlWorked) {
  heading('5. WebSocket handshake to Steam CM');

  if (endpoints.length === 0) {
    warn('Skipped: no usable WebSocket endpoints to try.');
    return false;
  }

  for (const endpoint of endpoints.slice(0, 4)) {
    const { opened, detail } = await tryWebSocket(`wss://${endpoint}/cmsocket/`);
    if (opened) {
      ok(`Steam accepted a WebSocket from this extension (${endpoint}, ${detail}).`);
      return true;
    }
    warn(`${endpoint}: ${detail}`);
  }

  bad('No CM server accepted a WebSocket from this extension.');
  if (controlWorked) {
    note('The control connection worked, so WebSockets are fine here and this');
    note('is specific to Steam. That would be a real finding.');
  } else {
    note('The control also failed, so this is inconclusive — something local is');
    note('blocking WebSocket traffic.');
  }
  return false;
}

function verdict({ token, control, steam }) {
  heading('Verdict');

  if (token && steam) {
    write('  Both gates pass. The extension approach is viable:', 'ok');
    write('  no password, no Steam Guard code, and no server of ours.', 'ok');
    return;
  }
  if (token && !steam && !control) {
    write('  Inconclusive. The token gate passes, but WebSockets do not work', 'warn');
    write('  here at all, so Steam was never really tested. Check for a', 'warn');
    write('  firewall, proxy or VPN, then re-run.', 'warn');
    return;
  }
  if (token && !steam && control) {
    write('  The token gate passes, but Steam refused every WebSocket while a', 'bad');
    write('  control connection succeeded. Send this report — it changes the plan.', 'bad');
    return;
  }
  write(`  token ${token ? 'OK' : 'FAILED'}, control ${control ? 'OK' : 'FAILED'}, steam ${steam ? 'OK' : 'FAILED'}.`, 'warn');
  write('  Send me this report.', 'warn');
}

async function run() {
  runButton.disabled = true;
  lines.length = 0;
  logEl.textContent = '';
  logEl.className = '';

  try {
    await checkLoggedIn();
    const token = await checkRefreshToken();
    const endpoints = await fetchCmServers();
    const control = await checkControl();
    const steam = await checkSteamWebSocket(endpoints, control);
    verdict({ token, control, steam });
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
