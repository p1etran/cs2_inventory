import { decodeJwtClaims } from '../../../src/core.js';

/**
 * The saved sign-in.
 *
 * A client refresh token is a credential, and this is the one place the
 * extension keeps one. It goes in `chrome.storage.local`, which is per-profile
 * and per-extension: it is not sent anywhere, there is no server to send it
 * to, and the only host it is ever presented to is Steam's own connection
 * manager. That is a weaker claim than "nothing is stored at all", which was
 * true while the extension borrowed the browser's own session -- so it is
 * stated plainly rather than glossed, and `forget()` exists and is offered in
 * the UI.
 */

const KEY = 'steamSession';

export interface SavedSession {
  refreshToken: string;
  accountName: string;
  /** When it was saved, so the UI can say how old the sign-in is. */
  savedAt: number;
}

export interface TokenStatus {
  usable: boolean;
  expiresAt: Date | null;
  steamId: string | null;
  /** Why it cannot be used, when it cannot. */
  problem: string | null;
}

/**
 * Judges a token before offering it to Steam.
 *
 * The audience check is the important one and the reason this project looks
 * the way it does: a token from the browser's Steam session carries `['web']`
 * and the CS2 coordinator will not grant it a session, however cleanly it logs
 * on. Saying so here beats an opaque refusal later.
 */
export function inspectToken(token: string, now = new Date()): TokenStatus {
  const unusable = (problem: string): TokenStatus => ({
    usable: false,
    expiresAt: null,
    steamId: null,
    problem,
  });

  const claims = token ? decodeJwtClaims(token) : null;
  if (!claims) return unusable('the saved sign-in is not readable');
  // Only refresh tokens carry iss=steam, and only those are accepted.
  if (claims.iss !== 'steam') return unusable('the saved sign-in is not a Steam refresh token');
  if (!claims.sub) return unusable('the saved sign-in names no account');
  if (!claims.aud?.includes('client')) {
    return unusable(
      'the saved sign-in is a browser session, which Steam will not let read storage units',
    );
  }

  const expiresAt = typeof claims.exp === 'number' ? new Date(claims.exp * 1000) : null;
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return {
      usable: false,
      expiresAt,
      steamId: claims.sub,
      problem: `the saved sign-in expired on ${expiresAt.toISOString().slice(0, 10)}`,
    };
  }

  return { usable: true, expiresAt, steamId: claims.sub, problem: null };
}

export async function loadSession(): Promise<SavedSession | null> {
  const stored = await chrome.storage.local.get(KEY);
  const session = stored[KEY] as SavedSession | undefined;
  if (!session?.refreshToken) return null;
  return session;
}

export async function saveSession(session: Omit<SavedSession, 'savedAt'>): Promise<void> {
  await chrome.storage.local.set({
    [KEY]: { ...session, savedAt: Date.now() } satisfies SavedSession,
  });
}

export async function forgetSession(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}
