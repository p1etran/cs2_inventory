import { describe, expect, it, vi } from 'vitest';
import type { CmClient } from '../extension/src/steam/cm.js';
import { EMsg } from '../extension/src/steam/emsg.js';
import { decodeNetMessage, encodeNetMessage } from '../extension/src/steam/frame.js';
import { GcClient, GcError, GcMsg, type GcEconItem } from '../extension/src/steam/gc.js';
import {
  CMsgCasketItem,
  CMsgGCClient,
  CMsgGCItemCustomizationNotification,
  CMsgSOCacheSubscribed,
  CMsgSOSingleObject,
  CSOEconItem,
  decode,
  encode,
} from '../extension/src/steam/protos.js';
import { ATTR, readCasketId } from '../src/core.js';

const CS2_APPID = 730;
const PROTO_MASK = 0x80000000;

interface Sent {
  emsg: number;
  body: Uint8Array;
  routingAppid?: number;
}

/** Stands in for a logged-on Steam connection. */
function fakeCm(): {
  cm: CmClient;
  sent: Sent[];
  /** Delivers a GC message as the CM would, envelope and all. */
  deliver: (gcMsg: number, body: Uint8Array, appid?: number) => void;
} {
  const handlers = new Map<number, ((message: unknown) => void)[]>();
  const sent: Sent[] = [];

  const cm = {
    on(emsg: number, handler: (message: unknown) => void) {
      const existing = handlers.get(emsg) ?? [];
      existing.push(handler);
      handlers.set(emsg, existing);
    },
    send(emsg: number, body: Uint8Array, routingAppid?: number) {
      sent.push({ emsg, body, routingAppid });
    },
  };

  const deliver = (gcMsg: number, body: Uint8Array, appid = CS2_APPID): void => {
    const envelope = encode(CMsgGCClient, {
      appid,
      msgtype: (gcMsg | PROTO_MASK) >>> 0,
      payload: encodeNetMessage(gcMsg, {}, body),
    });
    for (const handler of handlers.get(EMsg.ClientFromGC) ?? []) {
      handler({ emsg: EMsg.ClientFromGC, kind: 'protobuf', header: {}, body: envelope });
    }
  };

  return { cm: cm as unknown as CmClient, sent, deliver };
}

function econItem(fields: {
  id: string;
  def_index: number;
  casketId?: string;
  containedCount?: number;
  customName?: string;
}): Uint8Array {
  const attribute: { def_index: number; value_bytes: Uint8Array }[] = [];

  const u32 = (value: number) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return bytes;
  };

  if (fields.casketId !== undefined) {
    const id = BigInt(fields.casketId);
    attribute.push({ def_index: ATTR.CASKET_ID_LOW, value_bytes: u32(Number(id & 0xffffffffn)) });
    attribute.push({ def_index: ATTR.CASKET_ID_HIGH, value_bytes: u32(Number(id >> 32n)) });
  }
  if (fields.containedCount !== undefined) {
    attribute.push({ def_index: ATTR.CASKET_ITEM_COUNT, value_bytes: u32(fields.containedCount) });
  }
  if (fields.customName !== undefined) {
    const body = new TextEncoder().encode(fields.customName);
    const bytes = new Uint8Array(2 + body.length);
    new DataView(bytes.buffer).setUint16(0, body.length, true);
    bytes.set(body, 2);
    attribute.push({ def_index: ATTR.CUSTOM_NAME, value_bytes: bytes });
  }

  return encode(CSOEconItem, { id: fields.id, def_index: fields.def_index, quality: 4, attribute });
}

const cacheOf = (items: Uint8Array[]) =>
  encode(CMsgSOCacheSubscribed, { objects: [{ type_id: 1, object_data: items }] });

const singleObject = (item: Uint8Array) => encode(CMsgSOSingleObject, { type_id: 1, object_data: item });

const casketIdOf = (item: GcEconItem) => readCasketId(item.attribute);

/** A client wired to the same casket-id reader the page uses. */
const clientFor = (cm: CmClient) => new GcClient(cm, { casketIdOf });

describe('game coordinator envelope', () => {
  it('wraps a message so the msgtype appears in both the envelope and the payload', () => {
    const { cm, sent } = fakeCm();
    const gc = clientFor(cm);

    // connect() sends games-played then a hello; the hello is the GC message.
    void gc.connect().catch(() => {});

    const gamesPlayed = sent[0];
    expect(gamesPlayed?.emsg).toBe(EMsg.ClientGamesPlayed);

    const toGc = sent[1];
    expect(toGc?.emsg).toBe(EMsg.ClientToGC);
    // The CM needs routing_appid to know which GC this belongs to.
    expect(toGc?.routingAppid).toBe(CS2_APPID);

    const envelope = decode<{ appid: number; msgtype: number; payload: Uint8Array }>(
      CMsgGCClient,
      toGc?.body ?? new Uint8Array(),
    );
    expect(envelope.appid).toBe(CS2_APPID);
    expect(envelope.msgtype).toBe((GcMsg.ClientHello | PROTO_MASK) >>> 0);

    // The payload carries its own header repeating the same message id.
    expect(decodeNetMessage(envelope.payload).emsg).toBe(GcMsg.ClientHello);
  });

  it('ignores traffic for another app', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    // Another game's coordinator shares this connection, and its cache
    // messages have the same ids. Decoding one as ours would silently mix
    // another game's items into the inventory.
    const OTHER_APPID = 440;
    deliver(GcMsg.SO_CacheSubscribed, cacheOf([econItem({ id: '500', def_index: 7 })]), OTHER_APPID);
    expect(gc.items).toEqual([]);

    deliver(GcMsg.SO_CacheSubscribed, cacheOf([econItem({ id: '501', def_index: 7 })]));
    expect(gc.items.map((i) => i.id)).toEqual(['501']);
  });
});

describe('shared object cache', () => {
  it('stores the items the cache arrives with', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    deliver(
      GcMsg.SO_CacheSubscribed,
      cacheOf([
        econItem({ id: '100', def_index: 7 }),
        econItem({ id: '101', def_index: 1201, containedCount: 842, customName: 'noże' }),
      ]),
    );

    expect(gc.items).toHaveLength(2);
    expect(gc.storageUnits.map((u) => u.id)).toEqual(['101']);
  });

  it('keeps a 64-bit asset id exact', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);
    const id = '39457183930000123';

    deliver(GcMsg.SO_CacheSubscribed, cacheOf([econItem({ id, def_index: 7 })]));
    expect(gc.items[0]?.id).toBe(id);
  });

  it('adds items that arrive one at a time and replaces updated ones', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    deliver(GcMsg.SO_Create, singleObject(econItem({ id: '200', def_index: 7 })));
    expect(gc.items).toHaveLength(1);

    deliver(GcMsg.SO_Update, singleObject(econItem({ id: '200', def_index: 9 })));
    expect(gc.items).toHaveLength(1);
    expect(gc.items[0]?.def_index).toBe(9);
  });

  it('drops destroyed items', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    deliver(GcMsg.SO_Create, singleObject(econItem({ id: '300', def_index: 7 })));
    deliver(GcMsg.SO_Destroy, singleObject(econItem({ id: '300', def_index: 7 })));
    expect(gc.items).toEqual([]);
  });

  it('ignores shared objects that are not econ items', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    // type_id 2 is some other kind of object; decoding it as an item would
    // produce nonsense rather than an error, so the type check matters.
    deliver(
      GcMsg.SO_CacheSubscribed,
      encode(CMsgSOCacheSubscribed, {
        objects: [{ type_id: 2, object_data: [econItem({ id: '400', def_index: 7 })] }],
      }),
    );
    expect(gc.items).toEqual([]);
  });
});

describe('reading a storage unit', () => {
  it('asks for the unit and resolves on its notification', async () => {
    const { cm, sent, deliver } = fakeCm();
    const gc = clientFor(cm);
    const casketId = '900001';

    deliver(
      GcMsg.SO_CacheSubscribed,
      cacheOf([econItem({ id: casketId, def_index: 1201, containedCount: 2 })]),
    );

    const pending = gc.loadStorageUnit(casketId);

    const request = sent.at(-1);
    const envelope = decode<{ msgtype: number; payload: Uint8Array }>(
      CMsgGCClient,
      request?.body ?? new Uint8Array(),
    );
    expect(envelope.msgtype).toBe((GcMsg.CasketItemLoadContents | PROTO_MASK) >>> 0);

    const asked = decode<{ casket_item_id: string; item_item_id: string }>(
      CMsgCasketItem,
      decodeNetMessage(envelope.payload).body,
    );
    expect(asked.casket_item_id).toBe(casketId);
    expect(asked.item_item_id).toBe(casketId);

    // Contents arrive as ordinary creates, then the notification.
    deliver(GcMsg.SO_Create, singleObject(econItem({ id: '1', def_index: 7, casketId })));
    deliver(GcMsg.SO_Create, singleObject(econItem({ id: '2', def_index: 9, casketId })));
    deliver(
      GcMsg.ItemCustomizationNotification,
      encode(CMsgGCItemCustomizationNotification, { item_id: [casketId], request: 1012 }),
    );

    await expect(pending).resolves.toBeUndefined();
    expect(gc.itemsIn(casketId).map((i) => i.id)).toEqual(['1', '2']);
  });

  it('is not fooled by a notification for a different unit or request', async () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);
    const casketId = '900001';

    deliver(GcMsg.SO_CacheSubscribed, cacheOf([econItem({ id: casketId, def_index: 1201 })]));
    const pending = gc.loadStorageUnit(casketId);

    let settled = false;
    void pending.then(
      () => (settled = true),
      () => (settled = true),
    );

    // Another unit's contents, and a different request type for ours.
    deliver(
      GcMsg.ItemCustomizationNotification,
      encode(CMsgGCItemCustomizationNotification, { item_id: ['900002'], request: 1012 }),
    );
    deliver(
      GcMsg.ItemCustomizationNotification,
      encode(CMsgGCItemCustomizationNotification, { item_id: [casketId], request: 1013 }),
    );
    await new Promise((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);

    deliver(
      GcMsg.ItemCustomizationNotification,
      encode(CMsgGCItemCustomizationNotification, { item_id: [casketId], request: 1012 }),
    );
    await expect(pending).resolves.toBeUndefined();
  });

  it('does not list a storage unit that is itself inside one', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    deliver(
      GcMsg.SO_CacheSubscribed,
      cacheOf([
        econItem({ id: '1', def_index: 1201, containedCount: 10 }),
        econItem({ id: '2', def_index: 1201, containedCount: 3, casketId: '1' }),
      ]),
    );

    // `dist/cli.js containers` applies the same filter, and the cross-check
    // between the two is only meaningful while the lists agree.
    expect(gc.storageUnits.map((u) => u.id)).toEqual(['1']);
  });

  it('leaves no notification handler behind, whether it resolves or times out', async () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    // Counted rather than observed through behaviour: a leaked handler is
    // silent, because it re-checks the unit id and returns. So the only
    // honest measurement is how many are still registered.
    const registered = () =>
      (gc as unknown as { handlers: Map<number, unknown[]> }).handlers.get(
        GcMsg.ItemCustomizationNotification,
      )?.length ?? 0;

    const before = registered();

    // A sync reads every unit in turn, so one handler left behind per unit
    // would mean every later notification decoded once per unit already read.
    for (const id of ['900001', '900002', '900003']) {
      const pending = gc.loadStorageUnit(id);
      deliver(
        GcMsg.ItemCustomizationNotification,
        encode(CMsgGCItemCustomizationNotification, { item_id: [id], request: 1012 }),
      );
      await pending;
    }
    expect(registered()).toBe(before);

    // And the failing path, which is the one that would otherwise leak
    // silently: a unit that never reports back.
    vi.useFakeTimers();
    try {
      const pending = gc.loadStorageUnit('900004');
      const settled = pending.catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(await settled).toBeInstanceOf(GcError);
    } finally {
      vi.useRealTimers();
    }
    expect(registered()).toBe(before);
  });

  it('separates the contents of one unit from another', () => {
    const { cm, deliver } = fakeCm();
    const gc = clientFor(cm);

    deliver(
      GcMsg.SO_CacheSubscribed,
      cacheOf([
        econItem({ id: '1', def_index: 7, casketId: '900001' }),
        econItem({ id: '2', def_index: 7, casketId: '900002' }),
        econItem({ id: '3', def_index: 7 }), // loose in the inventory
      ]),
    );

    expect(gc.itemsIn('900001').map((i) => i.id)).toEqual(['1']);
    expect(gc.itemsIn('900002').map((i) => i.id)).toEqual(['2']);
  });
});
