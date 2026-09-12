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
  // 742 is `ClientGamesPlayed`, which Steam no longer acts on: sending it
  // leaves the account not in-game, so the CS2 coordinator ignores the hello
  // that follows and never answers. steam-user sends only this one.
  ClientGamesPlayedWithDataBlob: 5410,
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
  Busy: 10,
  AccessDenied: 15,
  Timeout: 16,
  ServiceUnavailable: 20,
  Revoked: 26,
  Expired: 27,
  TryAnotherCM: 48,
  AlreadyLoggedInElsewhere: 50,
  AccountLogonDenied: 63,
  RateLimitExceeded: 84,
  AccountLoginDeniedNeedTwoFactor: 85,
} as const;

/**
 * Explains a logon failure in the terms a person can act on. The refresh token
 * cases matter most: they are the ones where signing in to Steam again in this
 * browser is the fix.
 */
const LOGON_FAILURES: Record<number, string> = {
  [EResult.Fail]: 'Steam refused the logon without saying why. Worth retrying.',
  [EResult.NoConnection]: 'No connection to Steam.',
  [EResult.InvalidPassword]:
    'Steam rejected the saved session. Sign in to Steam again in this browser.',
  [EResult.LoggedInElsewhere]: 'Signed in elsewhere; Steam dropped this session.',
  [EResult.InvalidProtocolVer]:
    'This client reported a protocol version Steam no longer accepts.',
  [EResult.Busy]: 'Steam is busy. Try again shortly.',
  [EResult.AccessDenied]: 'Access denied for this account.',
  [EResult.Timeout]: 'Steam timed out.',
  [EResult.ServiceUnavailable]: 'Steam is temporarily unavailable. Try again shortly.',
  [EResult.Revoked]:
    'The saved Steam session was revoked. Sign in to Steam again in this browser.',
  [EResult.Expired]:
    'The saved Steam session has expired. Sign in to Steam again in this browser.',
  [EResult.TryAnotherCM]: 'Steam asked us to use a different server.',
  [EResult.AlreadyLoggedInElsewhere]: 'This account is already signed in to CS2 somewhere else.',
  [EResult.RateLimitExceeded]:
    'Steam is rate-limiting sign-ins from this address. Wait a few minutes.',
};

export function describeEResult(eresult: number): string {
  const known = Object.entries(EResult).find(([, value]) => value === eresult);
  const name = known ? known[0] : `EResult ${eresult}`;
  const explanation = LOGON_FAILURES[eresult];
  return explanation ? `${name}: ${explanation}` : name;
}
