import emsgNames from '../generated/emsg-names.json';

/**
 * The Steam message ids this extension uses, and the EResult codes worth
 * naming. Every value here is cross-checked against steam-user's enums by
 * `test/extension-emsg.test.ts`, because Steam does not report an
 * unrecognised message -- a wrong id shows up as silence, not an error.
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
  ClientChangeStatus: 716,
  ClientAccountInfo: 768,
  ClientToGC: 5452,
  ClientFromGC: 5453,
  ClientLogon: 5514,
  ClientPlayingSessionState: 9600,
  ClientKickPlayingSession: 9601,
} as const;

/**
 * Every Steam message id by name, generated from steam-user's enum.
 *
 * The whole table rather than just the ids above, because its only job is to
 * make an unexpected message legible -- and an unexpected message is by
 * definition one that is not in the list we handle.
 */
const ALL_EMSG_NAMES = emsgNames as Record<string, string>;

export function emsgName(emsg: number): string {
  const name = ALL_EMSG_NAMES[String(emsg)];
  return name ? `${name} (${emsg})` : `EMsg ${emsg}`;
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
