import GlobalOffensive from 'globaloffensive';
import SteamUser from 'steam-user';
import { DEF } from '../domain/attributes.js';
import { sleep } from '../util/log.js';
import type { RawEconItem } from '../domain/econ.js';

const CS2_APP_ID = 730;

export interface GcOptions {
  /** Where steam-user keeps its own machine-auth files. */
  dataDirectory: string;
  /** Delay between storage-unit reads, to stay under the GC's rate limit. */
  casketDelayMs?: number;
  loginTimeoutMs?: number;
  gcTimeoutMs?: number;
  casketTimeoutMs?: number;
  onProgress?: (message: string) => void;
}

export interface LoginResult {
  steamId: string;
  /** Steam rotates these, so a login can hand back a newer one than we sent. */
  refreshToken: string | null;
}

/**
 * Steam reports login failures as an EResult code with a terse name attached.
 * These are the ones worth explaining rather than passing through raw.
 */
const LOGIN_ERRORS: Record<number, string> = {
  3: 'Could not reach Steam. Check your internet connection and try again.',
  5: 'Steam rejected that account name or password.',
  6: 'Logged in elsewhere: Steam dropped this session because the account signed in somewhere else.',
  50: 'That account is already signed in to CS2 somewhere else. Close the game and try again.',
  63: 'This account needs a Steam Guard code to sign in.',
  65: 'That Steam Guard code was not accepted. Codes expire after 30 seconds, so try a fresh one.',
  84: 'Steam is rate-limiting sign-ins from this address. Wait a few minutes and try again.',
  88: 'That Steam Guard code was not accepted. Codes expire after 30 seconds, so try a fresh one.',
};

/** Turns a steam-user login failure into something worth showing a person. */
export function describeLoginError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const eresult = (error as { eresult?: number } | null)?.eresult;

  if (typeof eresult === 'number' && LOGIN_ERRORS[eresult]) {
    return `${LOGIN_ERRORS[eresult]} (Steam said: ${raw})`;
  }
  return raw;
}

export class GcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcError';
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new GcError(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * A logged-in CS2 client, used purely to read the account's own items.
 *
 * The public Steam Web API reports storage units as opaque single items, so
 * enumerating what is inside them means talking to the CS2 game coordinator
 * the same way the game itself does.
 */
export class GcClient {
  private readonly user: SteamUser;
  private readonly cs2: GlobalOffensive;
  private readonly options: Required<Omit<GcOptions, 'onProgress'>> & {
    onProgress: (message: string) => void;
  };
  private refreshToken: string | null = null;
  private loggedOn = false;

  constructor(options: GcOptions) {
    this.options = {
      dataDirectory: options.dataDirectory,
      casketDelayMs: options.casketDelayMs ?? 1100,
      loginTimeoutMs: options.loginTimeoutMs ?? 60_000,
      gcTimeoutMs: options.gcTimeoutMs ?? 60_000,
      casketTimeoutMs: options.casketTimeoutMs ?? 30_000,
      onProgress: options.onProgress ?? (() => {}),
    };

    this.user = new SteamUser();
    this.user.setOption('dataDirectory', this.options.dataDirectory);
    this.cs2 = new GlobalOffensive(this.user);

    // Emitted after a password login, and again whenever Steam rotates it.
    this.user.on('refreshToken', (token: string) => {
      this.refreshToken = token;
    });
  }

  private waitForLogin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const onLoggedOn = () => {
        this.user.removeListener('error', onError);
        this.loggedOn = true;
        const steamId = this.user.steamID?.getSteamID64();
        if (!steamId) {
          reject(new GcError('Logged on but Steam did not report a SteamID'));
          return;
        }
        resolve(steamId);
      };
      const onError = (error: Error) => {
        this.user.removeListener('loggedOn', onLoggedOn);
        reject(error);
      };
      this.user.once('loggedOn', onLoggedOn);
      this.user.once('error', onError);
    });
  }

  async loginWithRefreshToken(refreshToken: string): Promise<LoginResult> {
    // Listeners first: logOn is asynchronous and could settle immediately.
    const loggedOn = this.waitForLogin();

    // logOn rejects rather than emitting `error` when it dislikes the token
    // itself, and an unhandled rejection there would take the process down.
    const started = Promise.resolve(this.user.logOn({ refreshToken }) as unknown);
    const rejectedAtStart = started.then(() => new Promise<never>(() => {}));

    const steamId = await withTimeout(
      Promise.race([loggedOn, rejectedAtStart]),
      this.options.loginTimeoutMs,
      'Timed out waiting for Steam login',
    );
    return { steamId, refreshToken: this.refreshToken };
  }

  /** Launches CS2 so the game coordinator hands over the inventory. */
  async connectToGc(): Promise<void> {
    if (!this.loggedOn) throw new GcError('Not logged on to Steam');
    if (this.cs2.haveGCSession) return;

    const connected = new Promise<void>((resolve) => {
      this.cs2.once('connectedToGC', () => resolve());
    });

    this.user.setPersona(SteamUser.EPersonaState.Online);
    this.user.gamesPlayed([CS2_APP_ID], true);

    await withTimeout(
      connected,
      this.options.gcTimeoutMs,
      'Timed out connecting to the CS2 game coordinator. Is the account able to play CS2?',
    );
  }

  /**
   * Items the GC has handed us so far. Note that storage-unit contents can
   * appear here unprompted, so callers must filter on `casket_id` themselves.
   */
  get inventory(): RawEconItem[] {
    return (this.cs2.inventory ?? []) as RawEconItem[];
  }

  /** Storage units in the account, with the item count the game reports. */
  get caskets(): RawEconItem[] {
    return this.inventory.filter(
      (item) => item.def_index === DEF.STORAGE_UNIT && !item.casket_id,
    );
  }

  private readCasketOnce(casketId: string): Promise<RawEconItem[]> {
    return new Promise<RawEconItem[]>((resolve, reject) => {
      this.cs2.getCasketContents(casketId, (error, items) => {
        if (error) reject(error);
        else resolve((items ?? []) as RawEconItem[]);
      });
    });
  }

  /**
   * Reads one storage unit, retrying on the timeouts the GC hands out when it
   * is busy. Each attempt backs off further to avoid making throttling worse.
   */
  async readCasket(casketId: string, attempts = 3): Promise<RawEconItem[]> {
    let lastError: Error = new GcError(`Could not read storage unit ${casketId}`);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await withTimeout(
          this.readCasketOnce(casketId),
          this.options.casketTimeoutMs,
          `Timed out reading storage unit ${casketId}`,
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < attempts) {
          const backoff = this.options.casketDelayMs * 2 ** attempt;
          this.options.onProgress(
            `storage unit ${casketId}: ${lastError.message}; retrying in ${Math.round(backoff / 100) / 10}s`,
          );
          await sleep(backoff);
        }
      }
    }
    throw lastError;
  }

  get casketDelayMs(): number {
    return this.options.casketDelayMs;
  }

  disconnect(): void {
    try {
      this.user.gamesPlayed([], true);
      this.user.logOff();
    } catch {
      // Nothing useful to do if the socket is already gone.
    }
  }
}
