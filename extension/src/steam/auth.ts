import { CmClient } from './cm.js';
import {
  CAuthentication_BeginAuthSessionViaQR_Request,
  CAuthentication_BeginAuthSessionViaQR_Response,
  CAuthentication_PollAuthSessionStatus_Request,
  CAuthentication_PollAuthSessionStatus_Response,
  decode,
  encode,
} from './protos.js';

/**
 * Signing in by QR code, which is the only way this extension can read a
 * storage unit.
 *
 * Why it has to be this and not the session already in the browser: a browser
 * token is issued for audience `['web']`, a game client needs
 * `['web', 'client']`, and no Steam API widens one. Measured against the real
 * coordinator, a web session logs on fine and is even granted the game slot,
 * and the CS2 coordinator still answers `NO_SESSION` to every hello. A QR
 * scan, approved in the Steam mobile app, mints a client token instead.
 *
 * The exchange runs over an ordinary connection-manager socket with no
 * account attached -- there is no account yet, which is the point. That is
 * what `CmClient.callService` is for.
 */

/** EAuthTokenPlatformType.SteamClient. The audience hinges on this value. */
const PLATFORM_STEAM_CLIENT = 1;
/** EOSType.Win11, matching what the official client reports. */
const OS_TYPE_WIN11 = 20;
/** EGamingDeviceType: 1 is a desktop PC. */
const GAMING_DEVICE_DESKTOP = 1;

/**
 * How this shows up in the account's authorised-devices list.
 *
 * Deliberately self-identifying rather than a spoofed hostname: someone
 * auditing their Steam devices should be able to tell what this is and revoke
 * it, and a tool asking for a sign-in has no business disguising itself.
 */
const DEVICE_NAME = 'CS2 Inventory (browser extension)';

const POLL_TIMEOUT_MS = 5 * 60_000;
const MIN_POLL_INTERVAL_MS = 2_000;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface QrChallenge {
  clientId: string;
  requestId: Uint8Array;
  /** The URL to put in the QR code. The Steam app opens this when scanned. */
  challengeUrl: string;
  /** Seconds Steam asks us to wait between polls. */
  interval: number;
}

export interface SignedIn {
  refreshToken: string;
  accountName: string;
}

/** Asks Steam to start a QR sign-in and hand back a URL to display. */
export async function beginQrSession(cm: CmClient): Promise<QrChallenge> {
  const body = await cm.callService(
    'Authentication.BeginAuthSessionViaQR#1',
    encode(CAuthentication_BeginAuthSessionViaQR_Request, {
      device_friendly_name: DEVICE_NAME,
      platform_type: PLATFORM_STEAM_CLIENT,
      device_details: {
        device_friendly_name: DEVICE_NAME,
        platform_type: PLATFORM_STEAM_CLIENT,
        os_type: OS_TYPE_WIN11,
        gaming_device_type: GAMING_DEVICE_DESKTOP,
      },
    }),
  );

  const response = decode<{
    client_id?: string;
    request_id?: Uint8Array;
    challenge_url?: string;
    interval?: number;
  }>(CAuthentication_BeginAuthSessionViaQR_Response, body);

  if (!response.client_id || !response.request_id || !response.challenge_url) {
    throw new AuthError('Steam did not return a QR challenge');
  }

  return {
    clientId: response.client_id,
    requestId: response.request_id,
    challengeUrl: response.challenge_url,
    interval: response.interval ?? 5,
  };
}

interface PollResult {
  refreshToken?: string;
  accountName?: string;
  /** Steam rotates the challenge; when it does, the QR has to be redrawn. */
  newClientId?: string;
  newChallengeUrl?: string;
  /** True once the code has been scanned but not yet approved. */
  hadRemoteInteraction?: boolean;
}

/** Asks once whether the sign-in has been approved yet. */
export async function pollQrSession(cm: CmClient, challenge: QrChallenge): Promise<PollResult> {
  const body = await cm.callService(
    'Authentication.PollAuthSessionStatus#1',
    encode(CAuthentication_PollAuthSessionStatus_Request, {
      client_id: challenge.clientId,
      request_id: challenge.requestId,
    }),
  );

  const response = decode<{
    refresh_token?: string;
    account_name?: string;
    new_client_id?: string;
    new_challenge_url?: string;
    had_remote_interaction?: boolean;
  }>(CAuthentication_PollAuthSessionStatus_Response, body);

  return {
    refreshToken: response.refresh_token,
    accountName: response.account_name,
    newClientId: response.new_client_id,
    newChallengeUrl: response.new_challenge_url,
    hadRemoteInteraction: response.had_remote_interaction,
  };
}

export interface SignInOptions {
  /** Called with each QR URL to display, including after Steam rotates it. */
  onChallenge: (challengeUrl: string) => void;
  /** Called once the code has been scanned, before it is approved. */
  onScanned?: () => void;
  signal?: AbortSignal;
}

/**
 * Runs a QR sign-in to completion.
 *
 * Steam rotates the challenge periodically, so the poll loop watches for a new
 * one and redraws rather than letting the code go stale while someone is
 * reaching for their phone.
 */
export async function signInWithQr(cm: CmClient, options: SignInOptions): Promise<SignedIn> {
  let challenge = await beginQrSession(cm);
  options.onChallenge(challenge.challengeUrl);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let announcedScan = false;

  while (Date.now() < deadline) {
    if (options.signal?.aborted) throw new AuthError('Sign-in cancelled');

    const waitMs = Math.max(MIN_POLL_INTERVAL_MS, challenge.interval * 1000);
    await sleep(waitMs, options.signal);

    const result = await pollQrSession(cm, challenge);

    if (result.refreshToken) {
      return {
        refreshToken: result.refreshToken,
        accountName: result.accountName ?? '',
      };
    }

    if (result.hadRemoteInteraction && !announcedScan) {
      announcedScan = true;
      options.onScanned?.();
    }

    // A rotated challenge means the displayed code no longer works.
    if (result.newClientId) challenge = { ...challenge, clientId: result.newClientId };
    if (result.newChallengeUrl) {
      challenge = { ...challenge, challengeUrl: result.newChallengeUrl };
      options.onChallenge(result.newChallengeUrl);
    }
  }

  throw new AuthError('The QR code expired before it was approved');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AuthError('Sign-in cancelled'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
