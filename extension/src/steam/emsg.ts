/**
 * The handful of Steam message ids this extension uses, and the EResult codes
 * worth naming. Values taken from steam-user's enums; the full sets run to
 * hundreds of entries that would never be referenced.
 */
export const EMsg = {
  Multi: 1,
  ClientHeartBeat: 703,
  ClientLogOnResponse: 751,
  ClientLoggedOff: 757,
  ClientGamesPlayed: 742,
  ClientAccountInfo: 768,
  ClientToGC: 5452,
  ClientFromGC: 5453,
  ClientLogon: 5514,
} as const;

/** Reverse lookup, so an unexpected message can be logged by name. */
export const EMSG_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(EMsg).map(([name, value]) => [value, name]),
);

export function emsgName(emsg: number): string {
  return EMSG_NAMES[emsg] ?? `EMsg ${emsg}`;
}

export const EResult = {
  OK: 1,
  Fail: 2,
  NoConnection: 3,
  InvalidPassword: 5,
  LoggedInElsewhere: 6,
  InvalidProtocolVer: 7,
  Timeout: 16,
  ServiceUnavailable: 20,
  Busy: 22,
  AccessDenied: 15,
  Expired: 27,
  Revoked: 28,
  AlreadyLoggedInElsewhere: 50,
  RateLimitExceeded: 84,
  AccountLoginDeniedNeedTwoFactor: 63,
  AccountLogonDenied: 63,
  TryAnotherCM: 68,
} as const;

/**
 * Explains a logon failure in the terms a person can act on. The refresh token
 * cases matter most: they are the ones where signing in to Steam again in this
 * browser is the fix.
 */
const LOGON_FAILURES: Record<number, string> = {
  2: 'Steam refused the logon without saying why. Worth retrying.',
  3: 'No connection to Steam.',
  5: 'Steam rejected the saved session. Sign in to Steam again in this browser.',
  6: 'Signed in elsewhere; Steam dropped this session.',
  7: 'This client reported a protocol version Steam no longer accepts.',
  15: 'Access denied for this account.',
  16: 'Steam timed out.',
  20: 'Steam is temporarily unavailable. Try again shortly.',
  22: 'Steam is busy. Try again shortly.',
  27: 'The saved Steam session has expired. Sign in to Steam again in this browser.',
  28: 'The saved Steam session was revoked. Sign in to Steam again in this browser.',
  50: 'This account is already signed in to CS2 somewhere else.',
  68: 'Steam asked us to use a different server.',
  84: 'Steam is rate-limiting sign-ins from this address. Wait a few minutes.',
};

export function describeEResult(eresult: number): string {
  const known = Object.entries(EResult).find(([, value]) => value === eresult);
  const name = known ? known[0] : `EResult ${eresult}`;
  const explanation = LOGON_FAILURES[eresult];
  return explanation ? `${name}: ${explanation}` : name;
}
