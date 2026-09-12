import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { encodeNetMessage, JOBID_NONE, PROTO_MASK } from '../extension/src/steam/frame.js';
import {
  CMsgClientGamesPlayed,
  CMsgClientHello,
  CMsgGCClient,
  encode,
} from '../extension/src/steam/protos.js';

/**
 * Compares the bytes we send against the reference client's, message for
 * message.
 *
 * The local CLI is built on steam-user and globaloffensive and gets a game
 * coordinator session, so their output is the known-good answer. Anything the
 * extension sends differently is either a bug or a deliberate difference worth
 * naming -- and when the coordinator replies NO_SESSION, "is what we send even
 * right?" has to be settled before blaming the session's audience.
 *
 * Self-consistency would not do here. These are Valve's own generated codecs,
 * used by code that demonstrably works.
 */

const require = createRequire(import.meta.url);
const goProtos = require('globaloffensive/protobufs/generated/_load.js');
const suProtos = require('steam-user/protobufs/generated/_load.js');
const Language = require('globaloffensive/language.js') as Record<string, number>;

/** Reads a message id from the reference table, failing loudly if it moved. */
function gcMsgId(name: string): number {
  const id = Language[name];
  if (id === undefined) throw new Error(`globaloffensive/language.js has no ${name}`);
  return id;
}

const CS2_APPID = 730;

/**
 * Rebuilds `steam-user`'s sendToGC, from components/gamecoordinator.js:33-56.
 *
 * Deliberately transcribed rather than called: invoking the real one would
 * need a logged-on SteamUser and a socket. The shape is eight bytes of
 * msgtype-and-length, the protobuf header, then the body.
 */
function referenceSendToGc(appid: number, msgType: number, body: Buffer): Buffer {
  const masked = (msgType | PROTO_MASK) >>> 0;
  const protoHeader = suProtos.CMsgProtoBufHeader.encode({
    jobid_source: JOBID_NONE,
  }).finish() as Buffer;

  const header = Buffer.alloc(8);
  header.writeUInt32LE(masked, 0);
  header.writeInt32LE(protoHeader.length, 4);

  return suProtos.CMsgGCClient.encode({
    appid,
    msgtype: masked,
    payload: Buffer.concat([header, protoHeader, body]),
  }).finish() as Buffer;
}

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('what we send to the game coordinator', () => {
  it('is byte-identical to the reference client for the hello', () => {
    // globaloffensive/index.js:118-123 -- the exact fields it sends.
    const fields = {
      version: 2000244,
      client_session_need: 0,
      client_launcher: 0,
      steam_launcher: 0,
    };

    const reference = referenceSendToGc(
      CS2_APPID,
      gcMsgId('ClientHello'),
      goProtos.CMsgClientHello.encode(fields).finish() as Buffer,
    );

    const ours = encode(CMsgGCClient, {
      appid: CS2_APPID,
      msgtype: (gcMsgId('ClientHello') | PROTO_MASK) >>> 0,
      payload: encodeNetMessage(
        gcMsgId('ClientHello'),
        { jobid_source: JOBID_NONE },
        encode(CMsgClientHello, fields),
      ),
    });

    expect(hex(ours)).toBe(hex(reference));
  });

  it('agrees on the hello body alone, so a mismatch localises', () => {
    const fields = {
      version: 2000244,
      client_session_need: 0,
      client_launcher: 0,
      steam_launcher: 0,
    };
    expect(hex(encode(CMsgClientHello, fields))).toBe(
      hex(goProtos.CMsgClientHello.encode(fields).finish() as Buffer),
    );
  });

  it('uses the message id the reference uses', () => {
    // Pinned against globaloffensive's table rather than our own constant,
    // which would hold however wrong our constant was.
    expect(Language.ClientHello).toBe(4006);
    expect(Language.ClientWelcome).toBe(4004);
    expect(Language.ClientConnectionStatus).toBe(4009);
    expect(Language.CasketItemLoadContents).toBe(1094);
    expect(Language.ItemCustomizationNotification).toBe(1090);
  });
});

describe('what we send to Steam', () => {
  it('is byte-identical to the reference client for games-played', () => {
    // steam-user/components/apps.js:61-75 maps a bare appid to {game_id}.
    const fields = { games_played: [{ game_id: String(CS2_APPID) }] };

    expect(hex(encode(CMsgClientGamesPlayed, fields))).toBe(
      hex(suProtos.CMsgClientGamesPlayed.encode(fields).finish() as Buffer),
    );
  });
});
