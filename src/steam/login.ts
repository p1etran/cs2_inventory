import { EAuthSessionGuardType, EAuthTokenPlatformType, LoginSession } from 'steam-session';
import { generateAuthCode } from 'steam-totp';

/**
 * The part of steam-session's LoginSession this module drives. Narrowed to an
 * interface so the flow can be tested without talking to Steam.
 */
export interface AuthSession {
  startWithCredentials(details: {
    accountName: string;
    password: string;
    steamGuardCode?: string;
  }): Promise<{ actionRequired: boolean; validActions?: { type: number; detail?: string }[] }>;
  submitSteamGuardCode(code: string): Promise<void>;
  cancelLoginAttempt(): boolean;
  on(event: string, listener: (...args: never[]) => void): unknown;
  once(event: string, listener: (...args: never[]) => void): unknown;
  readonly refreshToken: string;
  readonly steamID: { getSteamID64(): string } | string;
}

export type SessionFactory = () => AuthSession;

export interface LoginIo {
  /**
   * Asks for a Steam Guard code. Must reject when the signal aborts, which is
   * how an open prompt is taken down once a phone approval lands.
   */
  requestCode(label: string, signal: AbortSignal): Promise<string>;
  report(message: string): void;
}

export interface PasswordLoginOptions {
  accountName: string;
  password: string;
  /** Mobile authenticator secret, if the user opted into generating codes locally. */
  sharedSecret?: string | null;
  io: LoginIo;
  createSession?: SessionFactory;
  debug?: (message: string) => void;
}

export interface PasswordLoginResult {
  steamId: string;
  refreshToken: string;
}

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoginError';
  }
}

const CODE_GUARDS = [EAuthSessionGuardType.DeviceCode, EAuthSessionGuardType.EmailCode];
const CONFIRMATION_GUARDS = [
  EAuthSessionGuardType.DeviceConfirmation,
  EAuthSessionGuardType.EmailConfirmation,
];

function steamId64(session: AuthSession): string {
  const id = session.steamID;
  return typeof id === 'string' ? id : id.getSteamID64();
}

/**
 * Both routes stay open at once, so the prompt says so: Steam polls for a phone
 * approval in the background while this waits for a typed code.
 */
function codeLabel(type: number, detail: string | undefined, canApproveOnDevice: boolean): string {
  const source =
    type === EAuthSessionGuardType.EmailCode
      ? `Steam Guard code emailed to ${detail ?? 'your address'}`
      : 'Steam Guard code from the Steam app';
  return canApproveOnDevice ? `${source} (or just approve on your phone): ` : `${source}: `;
}

/**
 * Signs in with a password and returns a refresh token.
 *
 * This drives steam-session directly rather than going through steam-user's
 * logOn, because steam-user cancels the auth session as soon as Steam asks for
 * a second factor. That makes approving the sign-in on a phone impossible --
 * the session being approved has already been thrown away. Here the session is
 * kept alive, so Steam's own polling completes the moment the user taps
 * approve, and a typed code is submitted against that same session instead of
 * triggering a whole new sign-in attempt.
 */
export async function loginWithPassword(
  options: PasswordLoginOptions,
): Promise<PasswordLoginResult> {
  const { io } = options;
  const session = (options.createSession ?? defaultSessionFactory)();

  if (options.debug) {
    const debug = options.debug;
    session.on('debug', ((...args: unknown[]) => {
      debug(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    }) as (...args: never[]) => void);
  }

  // Steam reports success by polling in the background, so the outcome arrives
  // as an event rather than as the result of a call.
  const finished = new Promise<void>((resolve, reject) => {
    session.once('authenticated', (() => resolve()) as (...args: never[]) => void);
    session.once('error', ((error: Error) =>
      reject(new LoginError(error?.message ?? 'Steam reported a sign-in error'))) as (
      ...args: never[]
    ) => void);
    session.once('timeout', (() =>
      reject(
        new LoginError('Steam gave up waiting for this sign-in to be approved.'),
      )) as (...args: never[]) => void);
  });

  session.once('remoteInteraction', (() =>
    io.report('Approval received from your phone, finishing sign-in...')) as (
    ...args: never[]
  ) => void);

  const started = await session
    .startWithCredentials({
      accountName: options.accountName,
      password: options.password,
      ...(options.sharedSecret ? { steamGuardCode: generateAuthCode(options.sharedSecret) } : {}),
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new LoginError(`Steam rejected the sign-in: ${message}`);
    });

  const controller = new AbortController();
  // Whatever ends the login -- approval, a submitted code, an error -- also
  // takes down a prompt that may still be waiting for input.
  void finished.then(
    () => controller.abort(),
    () => controller.abort(),
  );

  if (started.actionRequired) {
    const actions = started.validActions ?? [];
    const canApproveOnDevice = actions.some((a) => CONFIRMATION_GUARDS.includes(a.type));
    const codeAction = actions.find((a) => CODE_GUARDS.includes(a.type));

    if (!canApproveOnDevice && !codeAction) {
      session.cancelLoginAttempt();
      throw new LoginError(
        'Steam wants a sign-in confirmation this app cannot provide. Sign in through the Steam client once, then try again.',
      );
    }

    if (canApproveOnDevice) {
      io.report(
        codeAction
          ? 'Steam sent a confirmation to your phone. Approve it there, or type a code below.'
          : 'Steam sent a confirmation to your phone. Approve it there to continue.',
      );
    }

    if (codeAction) {
      void collectCode(
        session,
        io,
        codeLabel(codeAction.type, codeAction.detail, canApproveOnDevice),
        controller.signal,
      );
    }
  }

  try {
    await finished;
  } catch (error) {
    session.cancelLoginAttempt();
    throw error;
  }

  return { steamId: steamId64(session), refreshToken: session.refreshToken };
}

/**
 * Prompts for a code until one is accepted or the login finishes some other
 * way. A rejected code is retried against the same session, so the user is not
 * sent a fresh confirmation on every attempt.
 */
async function collectCode(
  session: AuthSession,
  io: LoginIo,
  label: string,
  signal: AbortSignal,
): Promise<void> {
  while (!signal.aborted) {
    let code: string;
    try {
      code = await io.requestCode(label, signal);
    } catch {
      return; // Prompt was cancelled, or the login completed elsewhere.
    }
    if (signal.aborted) return;

    if (!code) {
      io.report('Waiting for the sign-in to be approved on your phone...');
      continue;
    }

    try {
      await session.submitSteamGuardCode(code);
      io.report('Code accepted, finishing sign-in...');
      return;
    } catch (error) {
      if (signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      io.report(`Steam did not accept that code (${message}). Codes change every 30 seconds.`);
    }
  }
}

const defaultSessionFactory: SessionFactory = () =>
  new LoginSession(EAuthTokenPlatformType.SteamClient) as unknown as AuthSession;
