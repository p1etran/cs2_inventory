import { describe, expect, it, vi } from 'vitest';
import { CmClient } from '../extension/src/steam/cm.js';
import { EMsg } from '../extension/src/steam/emsg.js';
import { decodeNetMessage, encodeNetMessage } from '../extension/src/steam/frame.js';
import {
  CMsgClientLogon,
  CMsgClientPlayingSessionState,
  decode,
  encode,
} from '../extension/src/steam/protos.js';

/**
 * The message trace, tested directly.
 *
 * This is the diagnostic the next real run depends on: Steam answers a message
 * it does not recognise with silence rather than an error, so without a trace
 * a protocol mistake and a slow server look identical. A trace that quietly
 * did not work would make that run worthless, so it is worth a test of its
 * own rather than an assumption.
 *
 * `dispatch` is private and reached through a cast. The alternative is an
 * exported seam that exists only for tests, which is worse: it would invite
 * production callers into the middle of the receive path.
 */

type Dispatchable = { dispatch(bytes: Uint8Array): Promise<void> };

function clientWithLog(options: { traceMessages?: boolean } = {}) {
  const lines: string[] = [];
  const client = new CmClient({ onLog: (message) => lines.push(message), ...options });
  return { client, lines, feed: (bytes: Uint8Array) => (client as unknown as Dispatchable).dispatch(bytes) };
}

describe('the message trace', () => {
  it('names a message nothing handles, and says so', async () => {
    const { lines, feed } = clientWithLog();
    // ClientPersonaState: real, unhandled, and exactly the kind of message
    // that was being dropped invisibly.
    await feed(encodeNetMessage(766, {}, new Uint8Array(0)));

    expect(lines).toContainEqual('<- ClientPersonaState (766) (unhandled)');
  });

  it('does not call a handled message unhandled', async () => {
    const { client, lines, feed } = clientWithLog();
    client.on(766, () => {});
    await feed(encodeNetMessage(766, {}, new Uint8Array(0)));

    expect(lines).toContainEqual('<- ClientPersonaState (766)');
  });

  it('does not trace an envelope that only wraps a coordinator message', async () => {
    const { client, lines, feed } = clientWithLog();
    client.on(EMsg.ClientFromGC, () => {});

    // The coordinator layer names what was inside, immediately after. Tracing
    // the wrapper too doubles a 1000-item read to two thousand lines.
    await feed(encodeNetMessage(EMsg.ClientFromGC, {}, new Uint8Array(0)));
    expect(lines.filter((line) => line.startsWith('<-'))).toEqual([]);
  });

  it('can be turned off', async () => {
    const { lines, feed } = clientWithLog({ traceMessages: false });
    await feed(encodeNetMessage(766, {}, new Uint8Array(0)));

    expect(lines.filter((line) => line.startsWith('<-'))).toEqual([]);
  });
});

describe('the outbound trace', () => {
  /** Stands in for an open socket, capturing the frames handed to it. */
  function withSocket(client: CmClient): Uint8Array[] {
    const frames: Uint8Array[] = [];
    (client as unknown as { socket: unknown }).socket = {
      readyState: 1, // WebSocket.OPEN
      send: (frame: Uint8Array) => frames.push(frame),
    };
    return frames;
  }

  it('names what we send, not only what arrives', () => {
    const { client, lines } = clientWithLog();
    const frames = withSocket(client);

    client.send(EMsg.ClientHeartBeat, new Uint8Array(0));

    expect(lines).toContainEqual('-> ClientHeartBeat (703)');
    // And it really went to the socket, so the trace is not the only effect.
    expect(frames).toHaveLength(1);
  });

  it('can be turned off with the inbound trace', () => {
    const { client, lines } = clientWithLog({ traceMessages: false });
    withSocket(client);

    client.send(EMsg.ClientHeartBeat, new Uint8Array(0));
    expect(lines.filter((line) => line.startsWith('->'))).toEqual([]);
  });

  it('throws rather than silently dropping a frame with no socket', () => {
    const { client } = clientWithLog();
    expect(() => client.send(EMsg.ClientHeartBeat, new Uint8Array(0))).toThrow(/Not connected/);
  });
});

describe('service calls with no account', () => {
  function withSocket(client: CmClient): Uint8Array[] {
    const frames: Uint8Array[] = [];
    (client as unknown as { socket: unknown }).socket = {
      readyState: 1,
      send: (frame: Uint8Array) => frames.push(frame),
    };
    return frames;
  }

  /** Replies to a call as Steam would, matching by the job id it was sent with. */
  function replyTo(frame: Uint8Array, body: Uint8Array, eresult = 1, errorMessage?: string) {
    const sent = decodeNetMessage(frame);
    return encodeNetMessage(
      EMsg.ServiceMethodResponse,
      {
        jobid_target: sent.header.jobid_source,
        eresult,
        ...(errorMessage === undefined ? {} : { error_message: errorMessage }),
      },
      body,
    );
  }

  it('names the method and identifies no account, as Steam requires', async () => {
    const { client, feed } = clientWithLog();
    const frames = withSocket(client);
    // Even on a connection that already knows an account -- the QR exchange
    // has to be unauthenticated, or Steam rejects it.
    Object.assign(client as unknown as Record<string, unknown>, {
      steamId: '76561198061412334',
      sessionId: 42,
    });

    const pending = client.callService('Authentication.BeginAuthSessionViaQR#1', new Uint8Array([7]));
    const sent = decodeNetMessage(frames[0] as Uint8Array);

    expect(sent.emsg).toBe(9804); // ServiceMethodCallFromClientNonAuthed
    expect(sent.header.target_job_name).toBe('Authentication.BeginAuthSessionViaQR#1');
    expect(sent.header.steamid).toBe('0');
    expect(sent.header.client_sessionid).toBeFalsy();
    // Steam refuses a service call that does not name its realm.
    expect(sent.header.realm).toBe(1);

    await feed(replyTo(frames[0] as Uint8Array, new Uint8Array([1, 2, 3])));
    await expect(pending).resolves.toEqual(new Uint8Array([1, 2, 3]));
  });

  it('matches the reply by job id, not by message type', async () => {
    const { client, feed } = clientWithLog();
    const frames = withSocket(client);

    const first = client.callService('A.B#1', new Uint8Array(0));
    const second = client.callService('C.D#1', new Uint8Array(0));

    // Answer them out of order. Every service reply is the same EMsg, so only
    // the job id can tell them apart.
    await feed(replyTo(frames[1] as Uint8Array, new Uint8Array([2])));
    await feed(replyTo(frames[0] as Uint8Array, new Uint8Array([1])));

    await expect(first).resolves.toEqual(new Uint8Array([1]));
    await expect(second).resolves.toEqual(new Uint8Array([2]));
  });

  it('uses a fresh job id per call', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);

    void client.callService('A.B#1', new Uint8Array(0)).catch(() => {});
    void client.callService('A.B#1', new Uint8Array(0)).catch(() => {});

    const ids = frames.map((frame) => decodeNetMessage(frame).header.jobid_source);
    expect(ids[0]).not.toBe(ids[1]);
    // Positive, because the field is read as signed where Steam echoes it.
    for (const id of ids) expect(BigInt(id as string) > 0n).toBe(true);
  });

  it('surfaces Steam\'s own error message when a call fails', async () => {
    const { client, feed } = clientWithLog();
    const frames = withSocket(client);

    const pending = client.callService('A.B#1', new Uint8Array(0));
    await feed(replyTo(frames[0] as Uint8Array, new Uint8Array(0), 8, 'Invalid parameter'));

    await expect(pending).rejects.toThrow(/Invalid parameter/);
  });

  it('gives up on a call Steam never answers', async () => {
    vi.useFakeTimers();
    try {
      const { client } = clientWithLog();
      withSocket(client);

      const pending = client.callService('A.B#1', new Uint8Array(0), 1_000);
      const settled = pending.catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(1_100);

      expect(String(await settled)).toMatch(/A\.B#1 timed out/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens the connection with Steam\'s hello, not the coordinator\'s', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);

    client.sayHello();
    const sent = decodeNetMessage(frames[0] as Uint8Array);
    expect(sent.emsg).toBe(9805); // EMsg.ClientHello, unrelated to GC 4006
    // One field, protocol_version -- the GC's CMsgClientHello is a different
    // message that happens to share a name.
    expect(sent.body.length).toBeGreaterThan(0);
  });
});

describe('the logon a saved sign-in makes', () => {
  function withSocket(client: CmClient): Uint8Array[] {
    const frames: Uint8Array[] = [];
    (client as unknown as { socket: unknown }).socket = {
      readyState: 1,
      send: (frame: Uint8Array) => frames.push(frame),
    };
    return frames;
  }

  function logonFields(frames: Uint8Array[]) {
    const sent = decodeNetMessage(frames[0] as Uint8Array);
    expect(sent.emsg).toBe(EMsg.ClientLogon);
    return decode<{
      access_token?: string;
      client_os_type?: number;
      ui_mode?: number;
      account_name?: string;
      machine_id?: Uint8Array;
    }>(CMsgClientLogon, sent.body);
  }

  it('never says it is a web browser', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);
    void client.logOnWithToken('the-token', '76561198061412334').catch(() => {});

    const fields = logonFields(frames);
    // This is the bug that cost a round: with a client-audience token from a
    // QR sign-in and the game slot confirmed, ui_mode 4 still got NO_SESSION
    // from the CS2 coordinator. steam-user sets it only for a web logon nonce.
    expect(fields.ui_mode).toBeUndefined();
    // 16 is EOSType.Windows10; the "web" OS type is what gets refused.
    expect(fields.client_os_type).toBe(16);
  });

  it('carries the token and no account name, as Steam requires', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);
    void client.logOnWithToken('the-token', '76561198061412334').catch(() => {});

    const fields = logonFields(frames);
    expect(fields.access_token).toBe('the-token');
    // Steam refuses a logon that sends both a token and an account name.
    expect(fields.account_name).toBeUndefined();
  });

  it('sends the machine id when it has one, and omits it otherwise', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);
    const id = new Uint8Array([1, 2, 3]);

    void client.logOnWithToken('t', '765', id).catch(() => {});
    expect(logonFields(frames).machine_id).toEqual(id);

    const second = clientWithLog();
    const moreFrames = withSocket(second.client);
    void second.client.logOnWithToken('t', '765').catch(() => {});
    expect(logonFields(moreFrames).machine_id).toBeUndefined();
  });

  it('puts the account\'s SteamID in the header, before a session exists', () => {
    const { client } = clientWithLog();
    const frames = withSocket(client);
    void client.logOnWithToken('t', '76561198061412334').catch(() => {});

    // It is how the connection manager knows whose logon this is.
    expect(decodeNetMessage(frames[0] as Uint8Array).header.steamid).toBe('76561198061412334');
  });
});

describe('the playing-session state', () => {
  const playingState = (fields: { playing_blocked?: boolean; playing_app?: number }) =>
    encodeNetMessage(
      EMsg.ClientPlayingSessionState,
      {},
      encode(CMsgClientPlayingSessionState, fields),
    );

  it('is unknown until Steam says, which is itself a finding', () => {
    const { client } = clientWithLog();
    expect(client.playing).toBeNull();
  });

  it('records the slot being ours', async () => {
    const { client, lines, feed } = clientWithLog();
    await feed(playingState({ playing_blocked: false, playing_app: 730 }));

    expect(client.playing).toEqual({ blocked: false, playingApp: 730 });
    expect(lines.some((line) => /game slot is ours/.test(line))).toBe(true);
  });

  it('records the slot being held elsewhere, and names the app', async () => {
    const { client, lines, feed } = clientWithLog();
    await feed(playingState({ playing_blocked: true, playing_app: 730 }));

    expect(client.playing).toEqual({ blocked: true, playingApp: 730 });
    expect(lines.some((line) => /another session holds the game slot.*730/.test(line))).toBe(true);
  });

  it('tells a watcher that subscribed before or after the message', async () => {
    const { client, feed } = clientWithLog();
    const early: boolean[] = [];
    const late: boolean[] = [];

    client.onPlayingState((state) => early.push(state.blocked));
    await feed(playingState({ playing_blocked: true, playing_app: 730 }));
    client.onPlayingState((state) => late.push(state.blocked));

    expect(early).toEqual([true]);
    // A late watcher still gets the state already known, so ordering between
    // the logon and the GC connect cannot lose it.
    expect(late).toEqual([true]);
  });

  it('treats an empty message as the slot being free', async () => {
    const { client, feed } = clientWithLog();
    // Both fields are optional and Steam omits them when false/zero.
    await feed(playingState({}));

    expect(client.playing).toEqual({ blocked: false, playingApp: 0 });
  });
});
