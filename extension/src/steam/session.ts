/**
 * Turning the Steam login already in this browser into something the
 * connection manager will accept.
 *
 * The first attempt here read the long-lived refresh token out of the
 * `steamRefresh_steam` cookie and offered it as `access_token`. Steam refused
 * that with `InvalidPassword`: a token minted for a browser is not a token a
 * game client may log on with, and Valve is right not to let a web session
 * escalate itself that way.
 *
 * The supported route is an exchange. `steamcommunity.com/chat/clientjstoken`
 * takes the session cookies the browser already sends and hands back a
 * short-lived *web logon token*, together with the account name and SteamID.
 * That token is what `CMsgClientLogon.web_logon_nonce` is for.
 *
 * This is better than what it replaces, not merely different:
 *
 *  - No cookie is ever read, so the `cookies` permission is not needed. The
 *    browser attaches the session itself, the way it would for any page on
 *    steamcommunity.com.
 *  - The long-lived refresh token never leaves the cookie jar. Only a
 *    short-lived token reaches the CM, and nothing is stored anywhere.
 */

const CLIENT_TOKEN_URL = 'https://steamcommunity.com/chat/clientjstoken';

export interface SteamSession {
  steamId: string;
  accountName: string;
  /** Short-lived; fetch it immediately before logging on. */
  webLogonToken: string;
}

interface ClientJsToken {
  logged_in?: boolean;
  steamid?: string;
  account_name?: string;
  token?: string;
}

export class NoSteamSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSteamSessionError';
  }
}

export type TokenFetcher = (url: string) => Promise<unknown>;

const defaultFetcher: TokenFetcher = async (url) => {
  // `include` so the browser sends the steamcommunity.com session it already
  // holds. Host permission is what lets an extension do this at all.
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new NoSteamSessionError(`Steam returned HTTP ${response.status} for the logon token`);
  }
  return response.json();
};

/** Reads a session out of the token endpoint's reply. Pure, so it is testable. */
export function parseClientJsToken(body: unknown): SteamSession {
  const reply = (body ?? {}) as ClientJsToken;

  if (!reply.logged_in) {
    throw new NoSteamSessionError(
      'You are not signed in to Steam in this browser. Open steamcommunity.com, sign in, then try again.',
    );
  }
  if (!reply.token || !reply.steamid) {
    throw new NoSteamSessionError(
      'Steam said you are signed in but returned no logon token. Try reloading steamcommunity.com.',
    );
  }
  return {
    steamId: reply.steamid,
    accountName: reply.account_name ?? '',
    webLogonToken: reply.token,
  };
}

export async function readSteamSession(fetcher: TokenFetcher = defaultFetcher): Promise<SteamSession> {
  return parseClientJsToken(await fetcher(CLIENT_TOKEN_URL));
}
