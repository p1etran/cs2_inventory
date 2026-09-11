import type { CmClient } from './cm.js';
import { EMsg } from './emsg.js';
import { decodeNetMessage, encodeNetMessage } from './frame.js';
import {
  CMsgCasketItem,
  CMsgClientGamesPlayed,
  CMsgClientHello,
  CMsgClientWelcome,
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
} as const;

/** Shared-object type for an econ item. Everything else in the cache is ignored. */
const SO_TYPE_ECON_ITEM = 1;

/** The notification the GC sends once a storage unit's contents are loaded. */
const NOTIFICATION_CASKET_CONTENTS = 1012;

/** Storage units report how many items they hold in this attribute. */
const DEF_STORAGE_UNIT = 1201;

const WELCOME_TIMEOUT_MS = 45_000;
const CASKET_TIMEOUT_MS = 30_000;

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
      if (envelope.appid !== CS2_APPID || !envelope.payload) return;
      this.receive(envelope.payload);
    });

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

    for (const handler of this.handlers.get(gcMsg) ?? []) {
      try {
        handler(body);
      } catch (error) {
        this.log(`GC message ${gcMsg} failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  private sendToGc(gcMsg: number, body: Uint8Array = new Uint8Array(0)): void {
    // The envelope's msgtype carries the protobuf flag, and the payload
    // repeats it in its own header. Both are what the CM expects.
    const payload = encodeNetMessage(gcMsg, {}, body);
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
    this.cm.send(
      EMsg.ClientGamesPlayed,
      encode(CMsgClientGamesPlayed, { games_played: [{ game_id: String(CS2_APPID) }] }),
    );
    this.log('Reported CS2 as running');

    const welcome = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new GcError(
              'The CS2 game coordinator never sent a welcome. It may be down, or the account may not own CS2.',
            ),
          ),
        WELCOME_TIMEOUT_MS,
      );

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

    const hello = setInterval(() => {
      if (this.welcomed) {
        clearInterval(hello);
        return;
      }
      this.sendToGc(GcMsg.ClientHello, encode(CMsgClientHello, {}));
    }, 2000);
    this.sendToGc(GcMsg.ClientHello, encode(CMsgClientHello, {}));

    try {
      await welcome;
    } finally {
      clearInterval(hello);
    }
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
