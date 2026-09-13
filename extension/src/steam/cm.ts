import { describeEResult, EMsg, emsgName, EResult } from './emsg.js';
import {
  decodeNetMessage,
  encodeNetMessage,
  gunzip,
  JOBID_NONE,
  splitMultiPayload,
  type DecodedMessage,
  type MessageHeader,
} from './frame.js';
import {
  CMsgClientAccountInfo,
  CMsgClientHeartBeat,
  CMsgClientHelloSteam,
  CMsgClientLoggedOff,
  CMsgClientLogon,
  CMsgClientLogonResponse,
  CMsgClientPlayingSessionState,
  CMsgMulti,
  decode,
  encode,
} from './protos.js';
import { cmSocketUrl, fetchCmServers, type CmServer } from './servers.js';

/**
 * A Steam client connection, over a WebSocket, good enough to log on and to
 * carry game-coordinator traffic.
 *
 * Two things about this are not obvious and are both load-bearing:
 *
 *  - Steam's CM refuses any WebSocket handshake that carries an `Origin`
 *    header, so one has to be removed before connecting. Measured: from an
 *    extension origin the socket closes in ~150ms with code 1006, and with the
 *    header stripped the very same endpoint accepts it. A web page cannot do
 *    this, which is the reason this is an extension at all.
 *  - Over TLS there is no channel-encryption handshake. The first thing we
 *    send is the logon itself.
 */

const PROTOCOL_VERSION = 65580;
/**
 * What a desktop client reports for its OS. 16 is EOSType.Windows10.
 *
 * The web values that used to live here -- OS type 4294966596 (-700) and
 * ui_mode 4 -- are gone with the logon that used them: a session identifying
 * itself that way logs on fine and is granted the game slot, and the CS2
 * coordinator still answers NO_SESSION to every hello it sends.
 */
export const CLIENT_OS_WINDOWS = 16;
const ORIGIN_RULE_ID = 1;
const CONNECT_TIMEOUT_MS = 10_000;
const LOGON_TIMEOUT_MS = 20_000;
const SERVICE_TIMEOUT_MS = 15_000;

/**
 * Messages that only wrap a game-coordinator one.
 *
 * Tracing these as well doubles the log for no information: every line is
 * immediately followed by the coordinator message it carried, named. Reading a
 * single 1000-item storage unit is two thousand lines rather than one.
 */
const CARRIES_GC_TRAFFIC: ReadonlySet<number> = new Set([EMsg.ClientToGC, EMsg.ClientFromGC]);

/** What Steam says about our claim on the account's one game slot. */
export interface PlayingSessionState {
  blocked: boolean;
  /** The app another session is playing, or 0 when nothing holds the slot. */
  playingApp: number;
}

export interface LogonResult {
  steamId: string;
  cellId: number;
  heartbeatSeconds: number;
  /** Arrives just after the logon response, so it may not be set yet. */
  personaName: string | null;
  vanityUrl: string | null;
}

export type MessageHandler = (message: DecodedMessage) => void;

interface ServiceResponse {
  eresult?: number;
  errorMessage?: string;
  body: Uint8Array;
}

/**
 * A job id Steam will echo back. Positive, because the field is signed where
 * Steam reads it and a negative value comes back as something else.
 */
function randomJobId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  bytes[0] = (bytes[0] ?? 0) & 0x7f;
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value.toString();
}

export class CmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmError';
  }
}

/**
 * Removes the `Origin` header from CM WebSocket handshakes.
 *
 * Scoped to steamserver.net and to websocket requests, so it cannot affect
 * anything else the browser does. Registered as a dynamic rule rather than a
 * static one so it is only in force while the extension is actually in use.
 */
async function ensureOriginRuleRegistered(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ORIGIN_RULE_ID],
    addRules: [
      {
        id: ORIGIN_RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
          requestHeaders: [
            {
              header: 'Origin',
              operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation,
            },
          ],
        },
        condition: {
          requestDomains: ['steamserver.net'],
          resourceTypes: ['websocket' as chrome.declarativeNetRequest.ResourceType],
        },
      },
    ],
  });
}

export async function removeOriginRule(): Promise<void> {
  await chrome.declarativeNetRequest
    .updateDynamicRules({ removeRuleIds: [ORIGIN_RULE_ID] })
    .catch(() => {});
}

export interface CmOptions {
  onLog?: (message: string) => void;
  /**
   * Logs every message Steam sends, named, including the ones nothing handles.
   *
   * On by default, and worth keeping on. Steam answers an unrecognised message
   * with silence rather than an error, so without this a protocol mistake and
   * a slow server look identical -- which is exactly how a games-played sent
   * as the wrong EMsg survived two rounds of fixes.
   */
  traceMessages?: boolean;
}

export class CmClient {
  private socket: WebSocket | null = null;
  private sessionId = 0;
  private steamId = '0';
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private readonly handlers = new Map<number, MessageHandler[]>();
  /** Pending service calls, keyed by the job id we sent. */
  private readonly jobs = new Map<string, (result: ServiceResponse) => void>();
  private readonly log: (message: string) => void;
  private readonly trace: boolean;
  private accountInfo: { personaName: string | null } = { personaName: null };
  private playingState: PlayingSessionState | null = null;
  private readonly playingStateWatchers: ((state: PlayingSessionState) => void)[] = [];

  constructor(options: CmOptions = {}) {
    this.log = options.onLog ?? (() => {});
    this.trace = options.traceMessages ?? true;
  }

  /**
   * Whether another session holds the account's game slot. Null until Steam
   * has said either way -- and it saying nothing at all is itself a finding.
   */
  get playing(): PlayingSessionState | null {
    return this.playingState;
  }

  /** Calls back on each playing-session update, and once now if one is known. */
  onPlayingState(watcher: (state: PlayingSessionState) => void): void {
    this.playingStateWatchers.push(watcher);
    if (this.playingState) watcher(this.playingState);
  }

  on(emsg: number, handler: MessageHandler): void {
    const existing = this.handlers.get(emsg) ?? [];
    existing.push(handler);
    this.handlers.set(emsg, existing);
  }

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /** Opens a socket to the least-loaded server that will accept one. */
  async connect(): Promise<CmServer> {
    await ensureOriginRuleRegistered();
    this.log('Origin-stripping rule registered');

    const servers = await fetchCmServers();
    this.log(`${servers.length} WebSocket servers available on port 443`);

    let lastError: Error = new CmError('No Steam server accepted a connection');
    for (const server of servers.slice(0, 4)) {
      try {
        await this.openSocket(server);
        this.log(`Connected to ${server.endpoint}`);
        return server;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`${server.endpoint}: ${lastError.message}`);
      }
    }
    throw lastError;
  }

  private openSocket(server: CmServer): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(cmSocketUrl(server.endpoint));
      socket.binaryType = 'arraybuffer';

      const timer = setTimeout(() => {
        socket.close();
        reject(new CmError('Timed out opening the socket'));
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        clearTimeout(timer);
        socket.onmessage = (event) => this.receive(event.data as ArrayBuffer);
        socket.onclose = (event) => this.handleClose(event.code);
        this.socket = socket;
        resolve();
      };

      socket.onclose = (event) => {
        clearTimeout(timer);
        reject(
          new CmError(
            event.code === 1006
              ? 'Closed immediately (1006). Steam refused the handshake.'
              : `Closed with code ${event.code}`,
          ),
        );
      };
      socket.onerror = () => {
        // onclose follows and carries the code, which is the useful part.
      };
    });
  }

  private handleClose(code: number): void {
    this.stopHeartbeat();
    this.socket = null;
    this.log(`Connection closed (code ${code})`);
  }

  /**
   * Sends a message. `routingAppid` is needed for game-coordinator traffic:
   * the CM uses it to decide which GC the message belongs to.
   */
  send(emsg: number, body: Uint8Array = new Uint8Array(0), routingAppid?: number): void {
    this.transmit(
      emsg,
      {
        steamid: this.steamId,
        client_sessionid: this.sessionId,
        jobid_source: JOBID_NONE,
        jobid_target: JOBID_NONE,
        ...(routingAppid === undefined ? {} : { routing_appid: routingAppid }),
      },
      body,
    );
  }

  /** The one place a frame reaches the socket, so the trace cannot miss one. */
  private transmit(emsg: number, header: MessageHeader, body: Uint8Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new CmError('Not connected to Steam');
    }
    // Outbound as well as inbound. Tracing only what arrives left "are the
    // hellos even being sent" unanswerable across two runs.
    if (this.trace && !CARRIES_GC_TRAFFIC.has(emsg)) this.log(`-> ${emsgName(emsg)}`);
    this.socket.send(encodeNetMessage(emsg, header, body) as unknown as ArrayBufferView);
  }

  /**
   * Opens the connection for service calls that need no account.
   *
   * Steam's own hello, not the game coordinator's -- two different messages
   * that happen to share a name, which is why the generated one is
   * `CMsgClientHelloSteam`.
   */
  sayHello(): void {
    this.transmit(
      EMsg.ClientHello,
      { steamid: '0', client_sessionid: 0 },
      encode(CMsgClientHelloSteam, { protocol_version: PROTOCOL_VERSION }),
    );
  }

  /**
   * Calls a Steam service method without being logged on.
   *
   * This is how a QR sign-in starts: there is no account yet, so the call
   * cannot be authenticated. The reply is matched by job id rather than by
   * message type, because every service response arrives as the same EMsg.
   */
  async callService(
    target: string,
    body: Uint8Array,
    timeoutMs = SERVICE_TIMEOUT_MS,
  ): Promise<Uint8Array> {
    const jobId = randomJobId();

    const response = new Promise<ServiceResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.jobs.delete(jobId);
        reject(new CmError(`${target} timed out`));
      }, timeoutMs);

      this.jobs.set(jobId, (result) => {
        clearTimeout(timer);
        this.jobs.delete(jobId);
        resolve(result);
      });
    });

    this.transmit(
      EMsg.ServiceMethodCallFromClientNonAuthed,
      {
        steamid: '0',
        client_sessionid: 0,
        jobid_source: jobId,
        target_job_name: target,
        realm: 1,
      },
      body,
    );

    const result = await response;
    if (result.eresult !== undefined && result.eresult !== EResult.OK) {
      throw new CmError(
        `${target}: ${result.errorMessage || describeEResult(result.eresult)}`,
      );
    }
    return result.body;
  }

  /** Dispatches one frame, unwrapping Multi containers first. */
  private receive(data: ArrayBuffer): void {
    void this.dispatch(new Uint8Array(data)).catch((error: unknown) => {
      this.log(`Failed to handle a message: ${error instanceof Error ? error.message : error}`);
    });
  }

  private async dispatch(bytes: Uint8Array): Promise<void> {
    let message: DecodedMessage;
    try {
      message = decodeNetMessage(bytes);
    } catch (error) {
      this.log(`Undecodable frame: ${error instanceof Error ? error.message : error}`);
      return;
    }

    // Steam hands us a session id and confirms our SteamID in the header;
    // everything we send afterwards has to echo them back.
    if (message.header.client_sessionid) this.sessionId = message.header.client_sessionid;
    if (message.header.steamid && message.header.steamid !== '0') {
      this.steamId = message.header.steamid;
    }

    if (message.emsg === EMsg.Multi) {
      await this.expandMulti(message);
      return;
    }

    // A service reply is matched by job id, since every one of them arrives
    // as the same message type.
    const job = message.header.jobid_target && this.jobs.get(message.header.jobid_target);
    if (job) {
      if (this.trace) this.log(`<- ${emsgName(message.emsg)} (reply)`);
      job({
        eresult: message.header.eresult,
        errorMessage: message.header.error_message,
        body: message.body,
      });
      return;
    }

    if (message.emsg === EMsg.ClientAccountInfo) {
      const info = decode<{ persona_name?: string }>(CMsgClientAccountInfo, message.body);
      this.accountInfo.personaName = info.persona_name ?? null;
    }

    if (message.emsg === EMsg.ClientPlayingSessionState) {
      this.notePlayingState(message.body);
    }

    const handlers = this.handlers.get(message.emsg) ?? [];
    if (this.trace && !CARRIES_GC_TRAFFIC.has(message.emsg)) {
      this.log(`<- ${emsgName(message.emsg)}${handlers.length === 0 ? ' (unhandled)' : ''}`);
    }

    for (const handler of handlers) {
      handler(message);
    }
  }

  /**
   * Records whether we hold the game slot.
   *
   * This is the only thing that distinguishes "the coordinator is slow" from
   * "we never became in-game", and Steam volunteers it rather than answering a
   * request, so it is read here rather than waited for.
   */
  private notePlayingState(body: Uint8Array): void {
    const decoded = decode<{ playing_blocked?: boolean; playing_app?: number }>(
      CMsgClientPlayingSessionState,
      body,
    );
    const state: PlayingSessionState = {
      blocked: decoded.playing_blocked ?? false,
      playingApp: decoded.playing_app ?? 0,
    };
    this.playingState = state;
    this.log(
      state.blocked
        ? `Steam says another session holds the game slot${state.playingApp ? ` (app ${state.playingApp})` : ''}`
        : `Steam says the game slot is ours${state.playingApp ? ` (app ${state.playingApp})` : ' (no app running)'}`,
    );
    for (const watcher of this.playingStateWatchers) watcher(state);
  }

  /**
   * A Multi carries several messages at once, gzipped when it is worth it.
   * `size_unzipped` being non-zero is the signal that it was compressed.
   */
  private async expandMulti(message: DecodedMessage): Promise<void> {
    const multi = decode<{ size_unzipped?: number; message_body?: Uint8Array }>(
      CMsgMulti,
      message.body,
    );
    const payload = multi.message_body ?? new Uint8Array(0);
    const expanded = multi.size_unzipped ? await gunzip(payload) : payload;

    for (const sub of splitMultiPayload(expanded)) {
      await this.dispatch(sub);
    }
  }

  /**
   * Logs on with a client refresh token, from a QR sign-in.
   *
   * `access_token` carries the refresh token, and `account_name` must be left
   * unset -- Steam refuses a logon that sends both. The SteamID comes from the
   * token's own `sub` claim, and has to be in the header before a session
   * exists, because that is how the CM knows whose logon this is.
   */
  async logOnWithToken(
    refreshToken: string,
    steamId: string,
    machineId?: Uint8Array,
  ): Promise<LogonResult> {
    this.steamId = steamId;
    this.sessionId = 0;

    const result = this.awaitLogonResponse();

    /*
     * A desktop client, field for field as steam-user sends one
     * (`components/09-logon.js:83-120`, refresh-token path).
     *
     * `ui_mode` is the field that matters and the one that was wrong: set to 4
     * it says "I am a web browser", and the CS2 coordinator answers NO_SESSION
     * to that however good the token is -- measured, with a client-audience
     * token from a QR sign-in and the game slot confirmed. steam-user only
     * sets ui_mode for a web logon nonce, and never for a token logon, so it
     * is left out here.
     *
     * `client_os_type` has no honest answer: the protocol has no value for a
     * browser extension, and the one that means "web" is exactly what gets
     * refused. What the account's device list shows is honest -- the QR
     * sign-in names itself -- and that is the part a person actually reads.
     */
    this.send(
      EMsg.ClientLogon,
      encode(CMsgClientLogon, {
        protocol_version: PROTOCOL_VERSION,
        access_token: refreshToken,
        client_os_type: CLIENT_OS_WINDOWS,
        chat_mode: 2,
        should_remember_password: true,
        supports_rate_limit_response: true,
        machine_name: '',
        client_language: 'english',
        obfuscated_private_ip: { v4: 0 },
        ...(machineId ? { machine_id: machineId } : {}),
      }),
    );
    this.log(`Logon sent as a desktop client (OS type ${CLIENT_OS_WINDOWS})`);

    return result;
  }

  /** The reply Steam sends to a logon, whichever way it was made. */
  private awaitLogonResponse(): Promise<LogonResult> {
    return new Promise<LogonResult>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new CmError('Steam accepted the connection but never answered the logon')),
        LOGON_TIMEOUT_MS,
      );

      this.on(EMsg.ClientLogOnResponse, (message) => {
        clearTimeout(timer);
        const body = decode<{
          eresult?: number;
          heartbeat_seconds?: number;
          client_supplied_steamid?: string;
          cell_id?: number;
          vanity_url?: string;
        }>(CMsgClientLogonResponse, message.body);

        if (body.eresult !== EResult.OK) {
          reject(new CmError(describeEResult(body.eresult ?? 0)));
          return;
        }

        const heartbeatSeconds = body.heartbeat_seconds || 9;
        this.startHeartbeat(heartbeatSeconds);
        resolve({
          steamId: body.client_supplied_steamid ?? this.steamId,
          cellId: body.cell_id ?? 0,
          heartbeatSeconds,
          personaName: this.accountInfo.personaName,
          vanityUrl: body.vanity_url ?? null,
        });
      });

      this.on(EMsg.ClientLoggedOff, (message) => {
        const body = decode<{ eresult?: number }>(CMsgClientLoggedOff, message.body);
        clearTimeout(timer);
        reject(new CmError(`Steam logged us off: ${describeEResult(body.eresult ?? 0)}`));
      });
    });
  }

  private startHeartbeat(seconds: number): void {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      try {
        this.send(EMsg.ClientHeartBeat, encode(CMsgClientHeartBeat, { send_reply: true }));
      } catch {
        this.stopHeartbeat();
      }
    }, seconds * 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeat !== null) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }

  /** Waits for one message, for the request-then-response exchanges. */
  waitFor(emsg: number, timeoutMs = 20_000): Promise<DecodedMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new CmError(`Timed out waiting for ${emsgName(emsg)}`)),
        timeoutMs,
      );
      this.on(emsg, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.close(1000);
    this.socket = null;
  }
}
