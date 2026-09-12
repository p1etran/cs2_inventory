import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { encodeNetMessage, JOBID_NONE, PROTO_MASK } from '../extension/src/steam/frame.js';
import {
  CAuthentication_BeginAuthSessionViaQR_Request,
  CAuthentication_PollAuthSessionStatus_Request,
  CAuthentication_PollAuthSessionStatus_Response,
  CMsgClientGamesPlayed,
  CMsgClientHello,
  CMsgGCClient,
  decode,
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
const ssProtos = require('steam-session/dist/protobuf-generated/load.js').default;
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

describe('what we send to start a QR sign-in', () => {
  it('is byte-identical to steam-session for the QR request', () => {
    // steam-session/dist/AuthenticationClient.js:259-294 -- the device details
    // it sends for a SteamClient session, which is the audience we need.
    const name = 'CS2 Inventory (browser extension)';
    const fields = {
      device_friendly_name: name,
      platform_type: 1,
      device_details: {
        device_friendly_name: name,
        platform_type: 1,
        os_type: 20,
        gaming_device_type: 1,
      },
    };

    expect(hex(encode(CAuthentication_BeginAuthSessionViaQR_Request, fields))).toBe(
      hex(
        ssProtos.CAuthentication_BeginAuthSessionViaQR_Request.encode(fields).finish() as Buffer,
      ),
    );
  });

  it('is byte-identical to steam-session for a poll', () => {
    const fields = { client_id: '12345678901234567890', request_id: new Uint8Array([1, 2, 3, 4]) };

    expect(hex(encode(CAuthentication_PollAuthSessionStatus_Request, fields))).toBe(
      hex(
        ssProtos.CAuthentication_PollAuthSessionStatus_Request.encode(fields).finish() as Buffer,
      ),
    );
  });

  it('decodes a poll response steam-session encoded', () => {
    const encoded = ssProtos.CAuthentication_PollAuthSessionStatus_Response.encode({
      refresh_token: 'token-value',
      account_name: 'someone',
      had_remote_interaction: true,
      new_challenge_url: 'https://s.team/q/1/999',
    }).finish() as Buffer;

    expect(
      decode<{ refresh_token?: string; account_name?: string; had_remote_interaction?: boolean }>(
        CAuthentication_PollAuthSessionStatus_Response,
        new Uint8Array(encoded),
      ),
    ).toMatchObject({
      refresh_token: 'token-value',
      account_name: 'someone',
      had_remote_interaction: true,
    });
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
