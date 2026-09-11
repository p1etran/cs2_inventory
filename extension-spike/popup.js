/**
 * Feasibility spike for running the CS2 inventory reader as a browser
 * extension.
 *
 * Settled so far:
 *   - A usable Steam refresh token IS readable from the browser's cookies, so
 *     signing in needs no password and no Steam Guard code.
 *   - WebSockets work from an extension page (proved with a control host), but
 *     Steam's CM closes the handshake in ~150ms from a chrome-extension://
 *     origin. Fast enough that Steam answered and refused.
 *
 * Open question: what origin will Steam accept? Browsers always send an Origin
 * header on a WebSocket handshake and page JavaScript cannot remove it, so
 * this revision tries the two things an extension can do that a page cannot:
 *
 *   A. Strip the Origin header outright with declarativeNetRequest.
 *   B. Open the socket from inside a steamcommunity.com tab, so Steam sees
 *      Origin: https://steamcommunity.com -- one of its own.
 *
 * B is the likelier of the two: the competing extension describes itself as
 * working "through Steam Community in your browser", which reads as literal.
 *
 * Still read-only. Sockets are opened and closed without sending any protocol,
 * and no token is ever printed.
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

const ORIGIN_RULE_ID = 1001;

/** Reads one cookie, including httpOnly ones, which only an extension can do. */
function getCookie(url, name) {
  return new Promise((resolve) => {
    chrome.cookies.get({ url, name }, (cookie) => resolve(cookie || null));
  });
}

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

async function checkRefreshToken() {
  heading('2. Refresh token (this is what replaces the password)');

  for (const [url, name] of [
    ['https://login.steampowered.com', 'steamRefresh_steam'],
    ['https://steamcommunity.com', 'steamRefresh_steam'],
  ]) {
    const cookie = await getCookie(url, name);
    if (!cookie) continue;

    const { steamId, token } = splitSteamCookie(cookie.value);
    const claims = decodeClaims(token);
    if (!claims) {
      warn(`Found ${name} on ${new URL(url).host} but its claims did not decode.`);
      continue;
    }

    note(`issuer: ${claims.iss ?? '(none)'}   account: ${claims.sub ?? steamId ?? '(none)'}`);
    if (claims.exp) {
      const expires = new Date(claims.exp * 1000);
      note(`expires: ${expires.toISOString().slice(0, 10)}`);
    }
    if (claims.iss === 'steam') {
      ok('Usable Steam refresh token. No password needed.');
      return true;
    }
    warn(`Issuer is "${claims.iss}", not "steam".`);
  }

  bad('No usable refresh token found.');
  note('Most likely you did not tick "Remember me" when logging in to Steam.');
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
    const raw = (await response.json())?.response?.serverlist ?? [];
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
  note(`by type: ${tally(servers, 'type')}   by realm: ${tally(servers, 'realm')}`);

  const websockets = servers.filter(
    (s) => s.realm === 'steamglobal' && s.type === 'websockets' && s.endpoint,
  );
  const on443 = websockets.filter((s) => s.endpoint.endsWith(':443'));
  note(`steamglobal websockets: ${websockets.length}, of those on :443: ${on443.length}`);

  if (websockets.length === 0) {
    bad('No steamglobal WebSocket servers in the list.');
    return [];
  }
  const ordered = [...on443, ...websockets.filter((s) => !s.endpoint.endsWith(':443'))];
  return ordered.map((s) => s.endpoint);
}

/** Opens a socket and closes it at once. No protocol is spoken. */
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
    socket.onerror = () => {};
  });
}

async function checkControl() {
  heading('4. Control: can this extension open any WebSocket at all?');
  note(`Extension origin: ${location.origin}`);

  for (const url of ['wss://ws.postman-echo.com/raw', 'wss://echo.websocket.org']) {
    const { opened, detail } = await tryWebSocket(url);
    if (opened) {
      ok(`WebSockets work here (${new URL(url).host}, ${detail}).`);
      return true;
    }
    warn(`${new URL(url).host}: ${detail}`);
  }
  bad('No control WebSocket opened. Nothing below will prove anything.');
  return false;
}

/**
 * Does the endpoint answer ordinary HTTPS? A non-upgrade GET should be
 * refused by the server rather than by the network, which confirms the host
 * and path are real and that we are reaching Steam at all.
 */
async function checkReachable(endpoint) {
  const host = endpoint.replace(/:443$/, '');
  try {
    const response = await fetch(`https://${host}/cmsocket/`, { method: 'GET' });
    note(`plain HTTPS GET to ${host}/cmsocket/ answered HTTP ${response.status}`);
  } catch (error) {
    note(`plain HTTPS GET to ${host}/cmsocket/ failed: ${error.message}`);
  }
}

async function checkFromExtensionOrigin(endpoints) {
  heading('5. Steam CM, straight from the extension origin');

  if (endpoints.length === 0) {
    warn('Skipped: no usable endpoints.');
    return false;
  }
  await checkReachable(endpoints[0]);

  for (const endpoint of endpoints.slice(0, 2)) {
    const { opened, detail } = await tryWebSocket(`wss://${endpoint}/cmsocket/`);
    if (opened) {
      ok(`Accepted (${endpoint}, ${detail}).`);
      return true;
    }
    warn(`${endpoint}: ${detail}`);
  }
  note('Expected to fail: this is the baseline the two tests below try to beat.');
  return false;
}

/**
 * Test A. Browsers force an Origin header onto every WebSocket handshake and
 * page JavaScript cannot remove it -- but an extension can, through the
 * declarative request rules. If Steam only dislikes the extension origin,
 * sending none at all may be enough.
 */
async function checkWithOriginStripped(endpoints) {
  heading('6. Test A: same, with the Origin header stripped');

  if (endpoints.length === 0) {
    warn('Skipped: no usable endpoints.');
    return false;
  }
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    warn('Skipped: declarativeNetRequest is unavailable.');
    return false;
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ORIGIN_RULE_ID],
      addRules: [
        {
          id: ORIGIN_RULE_ID,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [{ header: 'Origin', operation: 'remove' }],
          },
          condition: { requestDomains: ['steamserver.net'], resourceTypes: ['websocket'] },
        },
      ],
    });
    note('Rule registered: Origin will be removed for steamserver.net sockets.');
  } catch (error) {
    warn(`Could not register the rule: ${error.message}`);
    note('That itself is useful: it means this route is not available.');
    return false;
  }

  try {
    for (const endpoint of endpoints.slice(0, 2)) {
      const { opened, detail } = await tryWebSocket(`wss://${endpoint}/cmsocket/`);
      if (opened) {
        ok(`Accepted with no Origin header (${endpoint}, ${detail}).`);
        return true;
      }
      warn(`${endpoint}: ${detail}`);
    }
    bad('Still refused with the Origin header removed.');
    return false;
  } finally {
    await chrome.declarativeNetRequest
      .updateDynamicRules({ removeRuleIds: [ORIGIN_RULE_ID] })
      .catch(() => {});
  }
}

/**
 * Test B. Run the socket from inside a steamcommunity.com tab, in the page's
 * own world, so the handshake carries Origin: https://steamcommunity.com. If
 * Steam accepts only its own origins, this is the route that works -- and it
 * is one a plain website could never take.
 */
async function checkFromSteamTab(endpoints) {
  heading('7. Test B: same, from inside a steamcommunity.com tab');

  if (endpoints.length === 0) {
    warn('Skipped: no usable endpoints.');
    return false;
  }
  if (!chrome.scripting?.executeScript) {
    warn('Skipped: the scripting API is unavailable.');
    return false;
  }

  const tabs = await chrome.tabs.query({ url: '*://steamcommunity.com/*' });
  if (tabs.length === 0) {
    warn('Skipped: no steamcommunity.com tab is open.');
    note('Open steamcommunity.com in another tab, then run this again.');
    return false;
  }
  note(`Using tab: ${tabs[0].url?.slice(0, 70)}`);

  for (const endpoint of endpoints.slice(0, 2)) {
    let result;
    try {
      const [injected] = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        world: 'MAIN',
        args: [`wss://${endpoint}/cmsocket/`],
        func: (url) =>
          new Promise((resolve) => {
            const startedAt = Date.now();
            const elapsed = () => `${Date.now() - startedAt}ms`;
            let socket;
            try {
              socket = new WebSocket(url);
            } catch (error) {
              resolve({ opened: false, detail: `construct failed: ${error.message}` });
              return;
            }
            const timer = setTimeout(() => {
              socket.close();
              resolve({ opened: false, detail: `timed out after ${elapsed()}`, origin: location.origin });
            }, 8000);
            socket.onopen = () => {
              clearTimeout(timer);
              const detail = `opened in ${elapsed()}`;
              socket.close(1000);
              resolve({ opened: true, detail, origin: location.origin });
            };
            socket.onclose = (event) => {
              clearTimeout(timer);
              resolve({
                opened: false,
                detail: `closed with code ${event.code} after ${elapsed()}`,
                origin: location.origin,
              });
            };
            socket.onerror = () => {};
          }),
      });
      result = injected?.result;
    } catch (error) {
      warn(`Could not run in the tab: ${error.message}`);
      return false;
    }

    if (!result) {
      warn(`${endpoint}: the injected test returned nothing.`);
      continue;
    }
    if (result.opened) {
      ok(`Accepted from ${result.origin} (${endpoint}, ${result.detail}).`);
      return true;
    }
    warn(`${endpoint} as ${result.origin ?? 'unknown origin'}: ${result.detail}`);
  }

  bad('Refused from a steamcommunity.com origin too.');
  return false;
}

function verdict({ token, control, direct, stripped, steamTab }) {
  heading('Verdict');

  if (!control) {
    write('  Inconclusive: WebSockets do not work here at all, so Steam was', 'warn');
    write('  never really tested. Check for a firewall, proxy or VPN.', 'warn');
    return;
  }
  if (!token) {
    write('  The token gate failed, which matters more than the rest.', 'bad');
    return;
  }

  if (direct) {
    write('  Steam accepts the extension origin directly. Simplest possible', 'ok');
    write('  shape: no header rules, no page injection.', 'ok');
    return;
  }
  if (stripped) {
    write('  Steam accepts the socket once the Origin header is removed.', 'ok');
    write('  Viable: the extension declares one request rule and connects', 'ok');
    write('  from its own service worker.', 'ok');
    return;
  }
  if (steamTab) {
    write('  Steam accepts a socket opened from a steamcommunity.com tab.', 'ok');
    write('  Viable, and it explains how the competing extension works. The', 'ok');
    write('  extension would run its reader inside a Steam tab. Worth noting:', 'ok');
    write('  a plain website could never do this, so this route is', 'ok');
    write('  extension-only.', 'ok');
    return;
  }

  write('  All three routes refused while the control succeeded. Steam is', 'bad');
  write('  rejecting browser-originated sockets, and the extension approach', 'bad');
  write('  needs rethinking. Send this report.', 'bad');
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
    const direct = await checkFromExtensionOrigin(endpoints);
    const stripped = direct ? false : await checkWithOriginStripped(endpoints);
    const steamTab = direct || stripped ? false : await checkFromSteamTab(endpoints);
    verdict({ token, control, direct, stripped, steamTab });
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
