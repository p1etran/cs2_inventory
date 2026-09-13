import { describe, expect, it, vi } from 'vitest';
import type { CmClient, PlayingSessionState } from '../extension/src/steam/cm.js';
import { EMsg } from '../extension/src/steam/emsg.js';
import { JOBID_NONE, decodeNetMessage, encodeNetMessage } from '../extension/src/steam/frame.js';
import { GcClient, GcError, GcMsg, type GcEconItem } from '../extension/src/steam/gc.js';
import {
  CMsgCasketItem,
  CMsgClientHello,
  CMsgClientWelcome,
  CMsgConnectionStatus,
  CMsgGCCStrike15_v2_ClientLogonFatalError,
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
  /** Reports what Steam said about the account's one game slot. */
  setPlaying: (state: PlayingSessionState) => void;
} {
  const handlers = new Map<number, ((message: unknown) => void)[]>();
  const playingWatchers: ((state: PlayingSessionState) => void)[] = [];
  const sent: Sent[] = [];
  let playing: PlayingSessionState | null = null;

  const cm = {
    on(emsg: number, handler: (message: unknown) => void) {
      const existing = handlers.get(emsg) ?? [];
      existing.push(handler);
      handlers.set(emsg, existing);
    },
    send(emsg: number, body: Uint8Array, routingAppid?: number) {
      sent.push({ emsg, body, routingAppid });
    },
    get playing() {
      return playing;
    },
    onPlayingState(watcher: (state: PlayingSessionState) => void) {
      playingWatchers.push(watcher);
      if (playing) watcher(playing);
    },
  };

  const setPlaying = (state: PlayingSessionState): void => {
    playing = state;
    for (const watcher of playingWatchers) watcher(state);
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

  return { cm: cm as unknown as CmClient, sent, deliver, setPlaying };
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
  /** Runs connect() far enough to have sent its first hello. */
  async function helloFrom(gc: GcClient, sent: Sent[]): Promise<Sent> {
    void gc.connect().catch(() => {});
    await vi.advanceTimersByTimeAsync(600);
    const toGc = sent.find((m) => m.emsg === EMsg.ClientToGC);
    expect(toGc).toBeDefined();
    return toGc as Sent;
  }

  it('wraps a message so the msgtype appears in both the envelope and the payload', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent } = fakeCm();
      const gc = clientFor(cm);
      const toGc = await helloFrom(gc, sent);

      // Literals, not our own EMsg constants: comparing a value against the
      // constant it came from holds however wrong that constant is, and did.
      // Steam stopped acting on 742 (ClientGamesPlayed), and with that one the
      // account never goes in-game, so the GC ignores every hello.
      //
      // Online (716) has to come before games-played (5410): a session is
      // Offline until it says otherwise, which is the order the Node client
      // uses too.
      expect(sent.slice(0, 2).map((m) => m.emsg)).toEqual([716, 5410]);

      // The CM needs routing_appid to know which GC this belongs to.
      expect(toGc.routingAppid).toBe(CS2_APPID);

      const envelope = decode<{ appid: number; msgtype: number; payload: Uint8Array }>(
        CMsgGCClient,
        toGc.body,
      );
      expect(envelope.appid).toBe(CS2_APPID);
      expect(envelope.msgtype).toBe((GcMsg.ClientHello | PROTO_MASK) >>> 0);

      // The payload carries its own header repeating the same message id.
      expect(decodeNetMessage(envelope.payload).emsg).toBe(GcMsg.ClientHello);
    } finally {
      vi.useRealTimers();
    }
  });

  it('traces what it sends, not only what arrives', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent } = fakeCm();
      const logged: string[] = [];
      const gc = new GcClient(cm, { casketIdOf, onLog: (m) => logged.push(m) });
      await helloFrom(gc, sent);

      // Inbound-only tracing left "is the hello even being sent" open across
      // two runs against the real coordinator.
      expect(logged).toContainEqual('-> GC ClientHello (4006)');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a hello it could not send, instead of losing it in a timer', async () => {
    vi.useFakeTimers();
    try {
      const { cm } = fakeCm();
      const logged: string[] = [];
      const gc = new GcClient(cm, { casketIdOf, onLog: (m) => logged.push(m) });

      // A disconnect between games-played and the hello throws inside the
      // timer, where nothing was catching it.
      const failing = cm as unknown as { send: (...args: unknown[]) => void };
      const original = failing.send;
      void gc.connect().catch(() => {});
      failing.send = () => {
        throw new Error('Not connected to Steam');
      };
      await vi.advanceTimersByTimeAsync(600);
      failing.send = original;

      expect(logged.some((line) => /Could not send hello: Not connected/.test(line))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets jobid_source explicitly, as the reference client does', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent } = fakeCm();
      const gc = clientFor(cm);
      const toGc = await helloFrom(gc, sent);

      const envelope = decode<{ payload: Uint8Array }>(CMsgGCClient, toGc.body);
      // The generated descriptor drops proto2 defaults on 64-bit fields,
      // because 2^64-1 does not survive a JS number -- so an empty header
      // would leave this unset rather than defaulted.
      expect(decodeNetMessage(envelope.payload).header.jobid_source).toBe(JOBID_NONE);
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells the GC a version, which it will not answer without', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent } = fakeCm();
      const gc = clientFor(cm);
      const toGc = await helloFrom(gc, sent);

      const envelope = decode<{ payload: Uint8Array }>(CMsgGCClient, toGc.body);
      const hello = decode<{ version?: number }>(
        CMsgClientHello,
        decodeNetMessage(envelope.payload).body,
      );
      // An empty hello gets no reply. The value is the one `globaloffensive`
      // sends, which reads storage units today.
      expect(hello.version).toBe(2000244);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps saying hello, backing off, until the welcome arrives', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent, deliver } = fakeCm();
      const gc = clientFor(cm);
      const connected = gc.connect();
      const helloCount = () => sent.filter((m) => m.emsg === EMsg.ClientToGC).length;

      // The GC drops a hello often enough that one attempt is not enough.
      await vi.advanceTimersByTimeAsync(600);
      expect(helloCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(helloCount()).toBeGreaterThan(1);

      // Backing off rather than a fixed interval, so a busy GC is not hammered.
      const byFiveSeconds = helloCount();
      await vi.advanceTimersByTimeAsync(5_000);
      expect(helloCount() - byFiveSeconds).toBeLessThan(byFiveSeconds);

      deliver(GcMsg.ClientWelcome, encode(CMsgClientWelcome, { version: 1 }));
      await connected;

      // And it stops once welcomed.
      const atWelcome = helloCount();
      await vi.advanceTimersByTimeAsync(120_000);
      expect(helloCount()).toBe(atWelcome);
    } finally {
      vi.useRealTimers();
    }
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

describe('when the coordinator answers but does not welcome us', () => {
  it('names a GC message nothing handles, instead of dropping it silently', () => {
    const { cm, deliver } = fakeCm();
    const logged: string[] = [];
    const gc = new GcClient(cm, { casketIdOf, onLog: (m) => logged.push(m) });
    void gc;

    // 9139 is MatchList: real, unhandled, and the kind of reply that was
    // being discarded without a trace. Named from the generated table rather
    // than from our own GcMsg list, which is the whole point.
    deliver(9139, new Uint8Array(0));
    expect(logged).toContainEqual('<- GC MatchList (9139) (unhandled)');
  });

  it('says so when it discards a message for another app', () => {
    const { cm, deliver } = fakeCm();
    const logged: string[] = [];
    const gc = new GcClient(cm, { casketIdOf, onLog: (m) => logged.push(m) });

    deliver(GcMsg.SO_CacheSubscribed, cacheOf([econItem({ id: '1', def_index: 7 })]), 440);
    expect(gc.items).toEqual([]);
    // It used to return without a word, so a reply could vanish -- and did.
    expect(logged.some((line) => /Ignored a GC message for app 440/.test(line))).toBe(true);
  });

  it('reports a login queue rather than calling it silence', async () => {
    vi.useFakeTimers();
    try {
      const { cm, deliver } = fakeCm();
      const logged: string[] = [];
      const gc = new GcClient(cm, { casketIdOf, onLog: (m) => logged.push(m) });
      const connected = gc.connect();

      deliver(
        GcMsg.ClientConnectionStatus,
        encode(CMsgConnectionStatus, {
          status: 3,
          queue_position: 412,
          queue_size: 900,
          estimated_wait_seconds_remaining: 120,
        }),
      );
      expect(logged.some((line) => /login queue: position 412 of 900, about 120s/.test(line))).toBe(
        true,
      );

      // A queue is not being ignored, so the original 60s deadline must not
      // fire while the coordinator is still reporting our place in it.
      await vi.advanceTimersByTimeAsync(61_000);
      deliver(GcMsg.ClientWelcome, encode(CMsgClientWelcome, { version: 1 }));
      await expect(connected).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('blames the queue, not the coordinator, if the queue outlasts the wait', async () => {
    vi.useFakeTimers();
    try {
      const { cm, deliver } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);

      deliver(
        GcMsg.ClientConnectionStatus,
        encode(CMsgConnectionStatus, { status: 3, queue_position: 7 }),
      );
      await vi.advanceTimersByTimeAsync(11 * 60_000);

      const message = ((await settled) as Error).message;
      expect(message).toMatch(/login queue at position 7/);
      expect(message).not.toMatch(/may not own/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives up immediately, with the reason, on an outright refusal', async () => {
    vi.useFakeTimers();
    try {
      const { cm, deliver } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);

      deliver(
        GcMsg.ClientLogonFatalError,
        encode(CMsgGCCStrike15_v2_ClientLogonFatalError, {
          errorcode: 7,
          message: 'This account is permanently banned from Competitive',
        }),
      );

      const error = (await settled) as Error;
      expect(error).toBeInstanceOf(GcError);
      expect(error.message).toContain('permanently banned');
    } finally {
      vi.useRealTimers();
    }
  });

  it('says hello again when told NO_SESSION', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent, deliver } = fakeCm();
      const gc = clientFor(cm);
      void gc.connect().catch(() => {});
      await vi.advanceTimersByTimeAsync(600);

      const before = sent.filter((m) => m.emsg === EMsg.ClientToGC).length;
      deliver(GcMsg.ClientConnectionStatus, encode(CMsgConnectionStatus, { status: 2 }));

      // The coordinator answered, just not with a session. That is an
      // invitation to retry, not merely something to log.
      expect(sent.filter((m) => m.emsg === EMsg.ClientToGC).length).toBe(before + 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends no hello after it has given up', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent, deliver } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(600);

      // Each status reply used to fork a second chain of hellos, and a fork
      // outlived connect() -- firing against a closed socket.
      for (let i = 0; i < 3; i += 1) {
        deliver(GcMsg.ClientConnectionStatus, encode(CMsgConnectionStatus, { status: 2 }));
        await vi.advanceTimersByTimeAsync(2_000);
      }

      await vi.advanceTimersByTimeAsync(61_000);
      await settled;

      const afterGivingUp = sent.filter((m) => m.emsg === EMsg.ClientToGC).length;
      await vi.advanceTimersByTimeAsync(300_000);
      expect(sent.filter((m) => m.emsg === EMsg.ClientToGC).length).toBe(afterGivingUp);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps one chain of hellos, not one per status reply', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent, deliver } = fakeCm();
      const gc = clientFor(cm);
      void gc.connect().catch(() => {});
      await vi.advanceTimersByTimeAsync(600);

      const helloCount = () => sent.filter((m) => m.emsg === EMsg.ClientToGC).length;
      // Three replies, three immediate retries -- and no extra pending timers
      // left behind to double up later.
      for (let i = 0; i < 3; i += 1) {
        deliver(GcMsg.ClientConnectionStatus, encode(CMsgConnectionStatus, { status: 2 }));
      }
      expect(helloCount()).toBe(4);

      // One chain means one hello on the next tick, not three.
      await vi.advanceTimersByTimeAsync(20_000);
      expect(helloCount()).toBe(5);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a status that is not a queue by name', async () => {
    vi.useFakeTimers();
    try {
      const { cm, deliver } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);

      deliver(GcMsg.ClientConnectionStatus, encode(CMsgConnectionStatus, { status: 1 }));
      await vi.advanceTimersByTimeAsync(61_000);

      expect(((await settled) as Error).message).toMatch(/GC_GOING_DOWN/);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('when Steam will not give us the game slot', () => {
  it('says which app is holding it rather than blaming the coordinator', async () => {
    vi.useFakeTimers();
    try {
      const { cm, setPlaying } = fakeCm();
      const gc = clientFor(cm);
      const connected = gc.connect();
      const settled = connected.catch((error: unknown) => error);

      setPlaying({ blocked: true, playingApp: 730 });

      const error = await settled;
      expect(error).toBeInstanceOf(GcError);
      // The user asked not to be kicked out of a match, so the only thing to
      // do is say so -- and no kick is ever sent.
      expect((error as Error).message).toMatch(/another session/i);
      expect((error as Error).message).toContain('730');
    } finally {
      vi.useRealTimers();
    }
  });

  it('never sends a kick on its own', async () => {
    vi.useFakeTimers();
    try {
      const { cm, sent, setPlaying } = fakeCm();
      const gc = clientFor(cm);
      void gc.connect().catch(() => {});
      setPlaying({ blocked: true, playingApp: 730 });
      await vi.advanceTimersByTimeAsync(1_000);

      // 9601 is ClientKickPlayingSession. Kicking would drop someone out of a
      // running match without warning.
      expect(sent.map((m) => m.emsg)).not.toContain(9601);
    } finally {
      vi.useRealTimers();
    }
  });

  it('blames the session, not the coordinator, when Steam says nothing at all', async () => {
    vi.useFakeTimers();
    try {
      const { cm } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(61_000);

      // No playing-session state ever arrived. Reporting "the GC may be down
      // or you may not own CS2" here is what sent two rounds of fixes into the
      // wrong place.
      const message = (await settled as Error).message;
      expect(message).toMatch(/never confirmed the game slot/i);
      expect(message).not.toMatch(/may not own/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it('says games-played did not take effect when another app is running', async () => {
    vi.useFakeTimers();
    try {
      const { cm, setPlaying } = fakeCm();
      const gc = clientFor(cm);
      const settled = gc.connect().catch((error: unknown) => error);
      // Not blocked, but also not CS2: games-played simply did not land.
      setPlaying({ blocked: false, playingApp: 0 });
      await vi.advanceTimersByTimeAsync(61_000);

      expect((await settled as Error).message).toMatch(/did not take effect/i);
    } finally {
      vi.useRealTimers();
    }
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
