/**
 * Reading the Steam session that is already in this browser.
 *
 * This is the whole reason the extension needs no password and no Steam Guard
 * code. A "remember me" login leaves a long-lived refresh token in a cookie
 * on login.steampowered.com, and only an extension can read it -- the cookie
 * is httpOnly and on another origin, so no web page can.
 *
 * Only a token issued by "steam" is accepted for a client logon. The token in
 * `steamLoginSecure` is a web access token and will be refused, so it is not
 * used here.
 */

export interface SteamSession {
  steamId: string;
  refreshToken: string;
  expiresAt: Date | null;
}

interface TokenClaims {
  iss?: string;
  sub?: string;
  exp?: number;
}

/** Steam packs these cookies as "<steamid>||<token>". */
function splitCookie(value: string): { steamId: string | null; token: string } {
  const decoded = decodeURIComponent(value);
  const separator = decoded.indexOf('||');
  if (separator === -1) return { steamId: null, token: decoded };
  return { steamId: decoded.slice(0, separator), token: decoded.slice(separator + 2) };
}

export function decodeTokenClaims(token: string): TokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as TokenClaims;
  } catch {
    return null;
  }
}

export class NoSteamSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSteamSessionError';
  }
}

const COOKIE_SOURCES = [
  { url: 'https://login.steampowered.com', name: 'steamRefresh_steam' },
  { url: 'https://steamcommunity.com', name: 'steamRefresh_steam' },
];

function getCookie(url: string, name: string): Promise<chrome.cookies.Cookie | null> {
  return new Promise((resolve) => {
    chrome.cookies.get({ url, name }, (cookie) => resolve(cookie ?? null));
  });
}

export async function readSteamSession(): Promise<SteamSession> {
  for (const source of COOKIE_SOURCES) {
    const cookie = await getCookie(source.url, source.name);
    if (!cookie) continue;

    const { steamId, token } = splitCookie(cookie.value);
    const claims = decodeTokenClaims(token);
    if (!claims || claims.iss !== 'steam') continue;

    const expiresAt = typeof claims.exp === 'number' ? new Date(claims.exp * 1000) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new NoSteamSessionError(
        `The Steam session in this browser expired on ${expiresAt.toISOString().slice(0, 10)}. Sign in to Steam again.`,
      );
    }

    const resolvedId = claims.sub ?? steamId;
    if (!resolvedId) continue;

    return { steamId: resolvedId, refreshToken: token, expiresAt };
  }

  throw new NoSteamSessionError(
    'No Steam session found in this browser. Sign in at steamcommunity.com with "Remember me" ticked, then try again.',
  );
}
