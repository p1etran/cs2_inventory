import { describe, expect, it } from 'vitest';
import { CmClient } from '../extension/src/steam/cm.js';
import { EMsg } from '../extension/src/steam/emsg.js';
import { encodeNetMessage } from '../extension/src/steam/frame.js';
import { CMsgClientPlayingSessionState, encode } from '../extension/src/steam/protos.js';

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

  it('can be turned off', async () => {
    const { lines, feed } = clientWithLog({ traceMessages: false });
    await feed(encodeNetMessage(766, {}, new Uint8Array(0)));

    expect(lines.filter((line) => line.startsWith('<-'))).toEqual([]);
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
