import type { CmClient } from './cm.js';
import { EMsg } from './emsg.js';
import { decodeNetMessage, encodeNetMessage, JOBID_NONE } from './frame.js';
import gcNames from '../generated/gc-names.json';
import {
  CMsgCasketItem,
  CMsgClientChangeStatus,
  CMsgClientGamesPlayed,
  CMsgClientHello,
  CMsgClientWelcome,
  CMsgConnectionStatus,
  CMsgGCCStrike15_v2_ClientLogonFatalError,
  CMsgGCClient,
  CMsgGCItemCustomizationNotification,
  CMsgSOCacheSubscribed,
  CMsgSOMultipleObjects,
  CMsgSOSingleObject,
  CSOEconItem,
  decode,
  encode,
} from './protos.js';

/**
 * The CS2 game coordinator, reached through an established Steam connection.
 *
 * The inventory arrives as a "shared object cache": on connecting, the GC
 * sends every item the account owns as a CSOEconItem. Storage units are in
 * there too, but only as items -- what they contain is withheld until asked
 * for one unit at a time, which is the entire reason this project exists.
 *
 * A GC message travels inside a CMsgGCClient envelope, and its payload uses
 * exactly the same framing as a Steam net message, so `encodeNetMessage` and
 * `decodeNetMessage` are reused rather than reimplemented.
 */

const CS2_APPID = 730;

/** Game-coordinator message ids, from globaloffensive's language.js. */
export const GcMsg = {
  SO_Create: 21,
  SO_Update: 22,
  SO_Destroy: 23,
  SO_CacheSubscribed: 24,
  SO_UpdateMultiple: 26,
  ItemCustomizationNotification: 1090,
  CasketItemLoadContents: 1094,
  ClientWelcome: 4004,
  ClientHello: 4006,
  ClientConnectionStatus: 4009,
  ClientLogonFatalError: 9187,
} as const;

/**
 * Every game-coordinator message by name, generated from globaloffensive's
 * table. As with the Steam side, the whole table ships: a coordinator that
 * replies with something we have no handler for is exactly the case that needs
 * to be readable, and it is by definition not one we handle.
 */
const GC_NAMES = gcNames as Record<string, string>;

export function gcMsgName(gcMsg: number): string {
  const name = GC_NAMES[String(gcMsg)];
  return name ? `${name} (${gcMsg})` : `GC message ${gcMsg}`;
}

/** GCConnectionStatus, from gcsdk_gcmessages.proto. */
const GC_STATUS: Record<number, string> = {
  0: 'HAVE_SESSION',
  1: 'GC_GOING_DOWN',
  2: 'NO_SESSION',
  3: 'NO_SESSION_IN_LOGON_QUEUE',
  4: 'NO_STEAM',
};
const STATUS_IN_LOGON_QUEUE = 3;

/** Shared-object type for an econ item. Everything else in the cache is ignored. */
const SO_TYPE_ECON_ITEM = 1;

/** The notification the GC sends once a storage unit's contents are loaded. */
const NOTIFICATION_CASKET_CONTENTS = 1012;

/** Storage units report how many items they hold in this attribute. */
const DEF_STORAGE_UNIT = 1201;

const WELCOME_TIMEOUT_MS = 60_000;
/** However long the coordinator claims a queue will take, stop waiting here. */
const QUEUE_WAIT_MAX_MS = 10 * 60_000;
const CASKET_TIMEOUT_MS = 30_000;

/**
 * What the hello reports itself as. Taken from the `globaloffensive` library,
 * which the local CLI uses and which reads storage units today, so this exact
 * value is known to be one the GC accepts. An empty hello is not: the GC wants
 * a version and simply does not reply without one.
 */
const HELLO = { version: 2000244, client_session_need: 0, client_launcher: 0, steam_launcher: 0 };

/** Persona state 1 is Online. A fresh session is Offline until told. */
const PERSONA_ONLINE = 1;

/** First hello, after Steam has had a moment to register the game session. */
const HELLO_DELAY_MS = 500;
/** Doubling from here, as the real client does, so a busy GC is not hammered. */
const HELLO_RETRY_MS = 1000;
const HELLO_RETRY_MAX_MS = 60_000;

/** A CSOEconItem as decoded off the wire, ready for `normalizeEconItem`. */
export interface GcEconItem {
  id?: string;
  def_index?: number;
  quality?: number;
  rarity?: number;
  origin?: number;
  inventory?: number;
  custom_name?: string;
  attribute?: { def_index?: number; value_bytes?: Uint8Array }[];
}

export class GcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcError';
  }
}

type GcHandler = (body: Uint8Array) => void;

export interface GcOptions {
  onLog?: (message: string) => void;
  /**
   * Reads the storage unit an item sits in. Injected rather than imported so
   * this layer stays pure transport: the attribute indices it would need live
   * in the shared domain code, which the page supplies.
   */
  casketIdOf?: (item: GcEconItem) => string | null;
}

export class GcClient {
  /** Every econ item the GC has told us about, keyed by asset id. */
  private readonly cache = new Map<string, GcEconItem>();
  private readonly handlers = new Map<number, GcHandler[]>();
  private readonly log: (message: string) => void;
  private readonly casketIdOf: (item: GcEconItem) => string | null;
  private welcomed = false;
  /** The last connection status the GC reported, if it reported one. */
  private status: { status: number; queuePosition: number; waitSeconds: number } | null = null;

  constructor(
    private readonly cm: CmClient,
    options: GcOptions = {},
  ) {
    this.log = options.onLog ?? (() => {});
    this.casketIdOf = options.casketIdOf ?? (() => null);

    this.cm.on(EMsg.ClientFromGC, (message) => {
      const envelope = decode<{ appid?: number; msgtype?: number; payload?: Uint8Array }>(
        CMsgGCClient,
        message.body,
      );
      // Both of these used to return silently, which meant a reply from the
      // coordinator could be discarded without a trace -- and one was.
      if (envelope.appid !== CS2_APPID) {
        this.log(`Ignored a GC message for app ${envelope.appid ?? 'unspecified'}`);
        return;
      }
      if (!envelope.payload) {
        this.log(`GC message ${envelope.msgtype ?? '?'} arrived with no payload`);
        return;
      }
      this.receive(envelope.payload);
    });

    this.on(GcMsg.ClientConnectionStatus, (body) => this.onConnectionStatus(body));
    this.on(GcMsg.SO_CacheSubscribed, (body) => this.onCacheSubscribed(body));
    this.on(GcMsg.SO_Create, (body) => this.onSingleObject(body));
    this.on(GcMsg.SO_Update, (body) => this.onSingleObject(body));
    this.on(GcMsg.SO_UpdateMultiple, (body) => this.onMultipleObjects(body));
    this.on(GcMsg.SO_Destroy, (body) => this.onDestroy(body));
  }

  on(gcMsg: number, handler: GcHandler): void {
    const existing = this.handlers.get(gcMsg) ?? [];
    existing.push(handler);
    this.handlers.set(gcMsg, existing);
  }

  off(gcMsg: number, handler: GcHandler): void {
    const existing = this.handlers.get(gcMsg);
    if (!existing) return;
    const at = existing.indexOf(handler);
    if (at >= 0) existing.splice(at, 1);
  }

  /** The payload carries its own header in the same layout as a net message. */
  private receive(payload: Uint8Array): void {
    let gcMsg: number;
    let body: Uint8Array;
    try {
      const decoded = decodeNetMessage(payload);
      gcMsg = decoded.emsg;
      body = decoded.body;
    } catch (error) {
      this.log(`Undecodable GC message: ${error instanceof Error ? error.message : error}`);
      return;
    }

    const handlers = this.handlers.get(gcMsg) ?? [];
    this.log(`<- GC ${gcMsgName(gcMsg)}${handlers.length === 0 ? ' (unhandled)' : ''}`);

    for (const handler of handlers) {
      try {
        handler(body);
      } catch (error) {
        this.log(
          `GC ${gcMsgName(gcMsg)} failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  private sendToGc(gcMsg: number, body: Uint8Array = new Uint8Array(0)): void {
    // The envelope's msgtype carries the protobuf flag, and the payload
    // repeats it in its own header. Both are what the CM expects.
    // jobid_source explicitly, as steam-user does, rather than relying on the
    // proto default -- the generated descriptor drops 64-bit defaults because
    // they do not survive a JS number.
    const payload = encodeNetMessage(gcMsg, { jobid_source: JOBID_NONE }, body);
    this.cm.send(
      EMsg.ClientToGC,
      encode(CMsgGCClient, {
        appid: CS2_APPID,
        msgtype: (gcMsg | 0x80000000) >>> 0,
        payload,
      }),
      CS2_APPID,
    );
  }

  /**
   * Notes what the coordinator says about our session.
   *
   * It can refuse one outright or put it in a login queue with a wait time,
   * and it reports that here rather than in a welcome. Discarding this message
   * is why a queue looked exactly like the coordinator being down.
   */
  private onConnectionStatus(body: Uint8Array): void {
    const decoded = decode<{
      status?: number;
      queue_position?: number;
      queue_size?: number;
      estimated_wait_seconds_remaining?: number;
    }>(CMsgConnectionStatus, body);

    const status = decoded.status ?? 0;
    this.status = {
      status,
      queuePosition: decoded.queue_position ?? 0,
      waitSeconds: decoded.estimated_wait_seconds_remaining ?? 0,
    };

    const name = GC_STATUS[status] ?? String(status);
    if (status === STATUS_IN_LOGON_QUEUE) {
      const size = decoded.queue_size ?? 0;
      const wait = this.status.waitSeconds;
      this.log(
        `Game coordinator login queue: position ${this.status.queuePosition}` +
          `${size ? ` of ${size}` : ''}${wait ? `, about ${wait}s remaining` : ''}`,
      );
      return;
    }
    this.log(`Game coordinator connection status: ${name}`);
  }

  /** A refusal with a reason, which is worth showing rather than swallowing. */
  private onLogonFatalError(body: Uint8Array): GcError {
    const decoded = decode<{ errorcode?: number; message?: string }>(
      CMsgGCCStrike15_v2_ClientLogonFatalError,
      body,
    );
    return new GcError(
      `The CS2 game coordinator refused this session: ${decoded.message || `error ${decoded.errorcode ?? 0}`}`,
    );
  }

  private store(objectData: Uint8Array): void {
    const item = decode<GcEconItem>(CSOEconItem, objectData);
    if (item.id) this.cache.set(item.id, item);
  }

  private onCacheSubscribed(body: Uint8Array): void {
    const cache = decode<{ objects?: { type_id?: number; object_data?: Uint8Array[] }[] }>(
      CMsgSOCacheSubscribed,
      body,
    );
    let added = 0;
    for (const group of cache.objects ?? []) {
      if (group.type_id !== SO_TYPE_ECON_ITEM) continue;
      for (const objectData of group.object_data ?? []) {
        this.store(objectData);
        added += 1;
      }
    }
    this.log(`Inventory cache: ${added} items`);
  }

  private onSingleObject(body: Uint8Array): void {
    const object = decode<{ type_id?: number; object_data?: Uint8Array }>(CMsgSOSingleObject, body);
    if (object.type_id !== SO_TYPE_ECON_ITEM || !object.object_data) return;
    this.store(object.object_data);
  }

  private onMultipleObjects(body: Uint8Array): void {
    const message = decode<{
      objects_modified?: { type_id?: number; object_data?: Uint8Array }[];
    }>(CMsgSOMultipleObjects, body);
    for (const object of message.objects_modified ?? []) {
      if (object.type_id !== SO_TYPE_ECON_ITEM || !object.object_data) continue;
      this.store(object.object_data);
    }
  }

  private onDestroy(body: Uint8Array): void {
    const object = decode<{ type_id?: number; object_data?: Uint8Array }>(CMsgSOSingleObject, body);
    if (object.type_id !== SO_TYPE_ECON_ITEM || !object.object_data) return;
    const item = decode<GcEconItem>(CSOEconItem, object.object_data);
    if (item.id) this.cache.delete(item.id);
  }

  /**
   * Launches CS2 and waits for the GC to hand over the inventory.
   *
   * "Playing" the game is a precondition, not a formality: the GC ignores a
   * client that has not reported itself in-game. The hello is then repeated
   * until the welcome arrives, which is what the real client does too -- the
   * GC quietly drops the first hello often enough that one attempt is not
   * enough.
   */
  async connect(): Promise<void> {
    // Online first. A session is Offline until it says otherwise, and the Node
    // client goes Online before reporting a game, so match it rather than
    // differ for no reason.
    this.cm.send(
      EMsg.ClientChangeStatus,
      encode(CMsgClientChangeStatus, { persona_state: PERSONA_ONLINE }),
    );

    this.cm.send(
      EMsg.ClientGamesPlayedWithDataBlob,
      encode(CMsgClientGamesPlayed, { games_played: [{ game_id: String(CS2_APPID) }] }),
    );
    this.log('Reported CS2 as running');

    // Steam volunteers this rather than answering a request, and it is the one
    // thing that separates a slow coordinator from never having been in-game.
    const blocked = new Promise<never>((_resolve, reject) => {
      this.cm.onPlayingState((state) => {
        if (!state.blocked) return;
        reject(
          new GcError(
            'Another session is using this account to play' +
              `${state.playingApp ? ` app ${state.playingApp}` : ''}. ` +
              'Close CS2 (or quit Steam) on that machine and try again.',
          ),
        );
      });
    });

    const welcome = new Promise<void>((resolve, reject) => {
      // Waiting in a queue is not the same as being ignored, so the deadline
      // moves while the coordinator is still telling us where we are.
      let timer = setTimeout(() => reject(new GcError(this.describeSilence())), WELCOME_TIMEOUT_MS);
      const extend = (ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => reject(new GcError(this.describeSilence())), ms);
      };

      this.on(GcMsg.ClientConnectionStatus, () => {
        if (this.welcomed || this.status?.status !== STATUS_IN_LOGON_QUEUE) return;
        // Its own estimate plus a margin, so a long queue is waited out rather
        // than reported as silence -- capped so a bad estimate cannot hang.
        const wait = Math.min(QUEUE_WAIT_MAX_MS, (this.status.waitSeconds + 30) * 1000);
        extend(Math.max(WELCOME_TIMEOUT_MS, wait));
      });

      this.on(GcMsg.ClientLogonFatalError, (body) => {
        clearTimeout(timer);
        reject(this.onLogonFatalError(body));
      });

      const onWelcome = (body: Uint8Array): void => {
        if (this.welcomed) return;
        this.welcomed = true;
        clearTimeout(timer);
        this.off(GcMsg.ClientWelcome, onWelcome);

        // The welcome can carry the cache inline as well as sending it
        // separately, so take it from here too.
        const message = decode<{
          version?: number;
          outofdate_subscribed_caches?: { objects?: { type_id?: number; object_data?: Uint8Array[] }[] }[];
        }>(CMsgClientWelcome, body);

        for (const cache of message.outofdate_subscribed_caches ?? []) {
          for (const group of cache.objects ?? []) {
            if (group.type_id !== SO_TYPE_ECON_ITEM) continue;
            for (const objectData of group.object_data ?? []) this.store(objectData);
          }
        }
        this.log(`Game coordinator welcomed us (version ${message.version ?? 0})`);
        resolve();
      };
      this.on(GcMsg.ClientWelcome, onWelcome);
    });

    // Repeated until the welcome arrives, because the GC drops a hello often
    // enough that one attempt is not enough. Backing off rather than a fixed
    // interval, matching the real client.
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retryMs = HELLO_RETRY_MS;
    const sendHello = (): void => {
      if (this.welcomed) return;
      this.sendToGc(GcMsg.ClientHello, encode(CMsgClientHello, HELLO));
      retryMs = Math.min(HELLO_RETRY_MAX_MS, retryMs * 2);
      timer = setTimeout(sendHello, retryMs);
    };
    timer = setTimeout(sendHello, HELLO_DELAY_MS);

    try {
      await Promise.race([welcome, blocked]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Explains a coordinator that never answered, in terms of what Steam said.
   *
   * Whether Steam confirmed the game slot is the useful distinction, and
   * guessing at "it may be down or you may not own CS2" when that is knowable
   * is how two rounds of fixes went into the wrong place.
   */
  private describeSilence(): string {
    if (this.status) {
      const name = GC_STATUS[this.status.status] ?? String(this.status.status);
      if (this.status.status === STATUS_IN_LOGON_QUEUE) {
        return (
          `Still in the CS2 game coordinator's login queue at position ${this.status.queuePosition}` +
          ' after waiting. The coordinator is up; it is just busy. Try again shortly.'
        );
      }
      return `The CS2 game coordinator reported ${name} and never sent a welcome.`;
    }

    const playing = this.cm.playing;
    if (playing === null) {
      return (
        'The CS2 game coordinator never answered, and Steam never confirmed the game slot either' +
        ' -- no playing-session state arrived at all. That points at this session not being' +
        ' allowed to play a game, rather than at the coordinator.'
      );
    }
    if (playing.playingApp !== CS2_APPID) {
      return (
        `Steam reports this session is playing app ${playing.playingApp || 'nothing'}, not ${CS2_APPID},` +
        ' so the coordinator has no reason to answer. Games-played did not take effect.'
      );
    }
    return (
      `Steam confirms this session is playing ${CS2_APPID}, but the coordinator did not answer` +
      ' within a minute. It may genuinely be down, or the account may not own CS2.'
    );
  }

  /** Every item the GC has told us about, in arrival order. */
  get items(): GcEconItem[] {
    return [...this.cache.values()];
  }

  /**
   * Storage units. These sit in the ordinary inventory; it is only their
   * contents that have to be asked for.
   *
   * A unit that reports a casket of its own is excluded, matching what the
   * Node client does. That filter is the difference between this list and the
   * one `dist/cli.js containers` prints, so the two stay comparable.
   */
  get storageUnits(): GcEconItem[] {
    return this.items.filter(
      (item) => item.def_index === DEF_STORAGE_UNIT && this.casketIdOf(item) === null,
    );
  }

  /** Items the GC has given us that live inside the given storage unit. */
  itemsIn(casketId: string): GcEconItem[] {
    return this.items.filter((item) => this.casketIdOf(item) === casketId);
  }

  /**
   * Asks the GC to load one storage unit's contents.
   *
   * The contents arrive as ordinary shared-object creates, followed by a
   * notification naming the unit. So the wait is for the notification, and the
   * items are then read out of the cache.
   */
  async loadStorageUnit(casketId: string): Promise<void> {
    // The handler is removed on both paths. A sync reads every unit in turn,
    // so one left behind per unit would mean every later notification being
    // decoded once per unit already read.
    let done = (): void => {};

    const loaded = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new GcError(`Timed out loading storage unit ${casketId}`)),
        CASKET_TIMEOUT_MS,
      );

      const onNotification = (body: Uint8Array): void => {
        const notification = decode<{ item_id?: string[]; request?: number }>(
          CMsgGCItemCustomizationNotification,
          body,
        );
        if (notification.request !== NOTIFICATION_CASKET_CONTENTS) return;
        if (!notification.item_id?.includes(casketId)) return;
        resolve();
      };

      done = () => {
        clearTimeout(timer);
        this.off(GcMsg.ItemCustomizationNotification, onNotification);
      };
      this.on(GcMsg.ItemCustomizationNotification, onNotification);
    });

    this.sendToGc(
      GcMsg.CasketItemLoadContents,
      encode(CMsgCasketItem, { casket_item_id: casketId, item_item_id: casketId }),
    );

    try {
      await loaded;
    } finally {
      done();
    }
  }
}
