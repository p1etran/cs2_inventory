import { describeEResult, EMsg, emsgName, EResult } from './emsg.js';
import {
  decodeNetMessage,
  encodeNetMessage,
  gunzip,
  JOBID_NONE,
  splitMultiPayload,
  type DecodedMessage,
} from './frame.js';
import {
  CMsgClientAccountInfo,
  CMsgClientHeartBeat,
  CMsgClientLoggedOff,
  CMsgClientLogon,
  CMsgClientLogonResponse,
  CMsgMulti,
  decode,
  encode,
} from './protos.js';
import { cmSocketUrl, fetchCmServers, type CmServer } from './servers.js';
import type { SteamSession } from './session.js';

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
 * The OS type and UI mode a web-based client reports. Both come from
 * steam-user's own handling of a web logon token: 4294966596 is -700 as a
 * uint32, Valve's "web" OS type, and ui_mode 4 marks a web client.
 */
const CLIENT_OS_WEB = 4294966596;
const UI_MODE_WEB = 4;
const ORIGIN_RULE_ID = 1;
const CONNECT_TIMEOUT_MS = 10_000;
const LOGON_TIMEOUT_MS = 20_000;

export interface LogonResult {
  steamId: string;
  cellId: number;
  heartbeatSeconds: number;
  /** Arrives just after the logon response, so it may not be set yet. */
  personaName: string | null;
  vanityUrl: string | null;
}

export type MessageHandler = (message: DecodedMessage) => void;

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
}

export class CmClient {
  private socket: WebSocket | null = null;
  private sessionId = 0;
  private steamId = '0';
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private readonly handlers = new Map<number, MessageHandler[]>();
  private readonly log: (message: string) => void;
  private accountInfo: { personaName: string | null } = { personaName: null };

  constructor(options: CmOptions = {}) {
    this.log = options.onLog ?? (() => {});
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

  send(emsg: number, body: Uint8Array = new Uint8Array(0)): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new CmError('Not connected to Steam');
    }
    const message = encodeNetMessage(
      emsg,
      {
        steamid: this.steamId,
        client_sessionid: this.sessionId,
        jobid_source: JOBID_NONE,
        jobid_target: JOBID_NONE,
      },
      body,
    );
    this.socket.send(message as unknown as ArrayBufferView);
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

    if (message.emsg === EMsg.ClientAccountInfo) {
      const info = decode<{ persona_name?: string }>(CMsgClientAccountInfo, message.body);
      this.accountInfo.personaName = info.persona_name ?? null;
    }

    for (const handler of this.handlers.get(message.emsg) ?? []) {
      handler(message);
    }
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
   * Logs on with the refresh token from the browser's Steam session.
   *
   * The header must carry the account's SteamID before a session exists,
   * because that is how the CM knows whose logon this is.
   */
  async logOn(session: SteamSession): Promise<LogonResult> {
    this.steamId = session.steamId;
    this.sessionId = 0;

    const result = new Promise<LogonResult>((resolve, reject) => {
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

    // A web logon token is a different shape of logon from a password or a
    // refresh token: Steam expects the web OS type and UI mode, and none of
    // the fields a desktop client would send. steam-user strips exactly these
    // for this path, and sending them anyway is a way to be refused.
    this.send(
      EMsg.ClientLogon,
      encode(CMsgClientLogon, {
        protocol_version: PROTOCOL_VERSION,
        web_logon_nonce: session.webLogonToken,
        account_name: session.accountName,
        client_os_type: CLIENT_OS_WEB,
        ui_mode: UI_MODE_WEB,
        chat_mode: 2,
      }),
    );
    this.log('Logon sent, waiting for Steam');

    return result;
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
