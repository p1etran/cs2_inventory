import path from 'node:path';
import protobuf from 'protobufjs';
import { describe, expect, it } from 'vitest';
import {
  decodeNetMessage,
  encodeNetMessage,
  gunzip,
  JOBID_NONE,
  PROTO_MASK,
  splitMultiPayload,
} from '../extension/src/steam/frame.js';
import {
  CMsgClientLogon,
  CMsgClientLogonResponse,
  CMsgMulti,
  CMsgProtoBufHeader,
  decode,
  encode,
} from '../extension/src/steam/protos.js';
import { EMsg } from '../extension/src/steam/emsg.js';
import { cmSocketUrl, selectServers } from '../extension/src/steam/servers.js';
import { parseClientJsToken, readSteamSession } from '../extension/src/steam/session.js';

const REPO = path.resolve(import.meta.dirname, '..');

/**
 * Parses Valve's full common.proto independently of our trimmed descriptor.
 * Comparing encodings against this is what proves the trimming did not change
 * the wire format -- a wrong field number would be invisible otherwise, since
 * our encoder and decoder would agree with each other while disagreeing with
 * Steam.
 */
function referenceRoot(): protobuf.Root {
  const root = new protobuf.Root();
  const resolve = root.resolvePath.bind(root);
  root.resolvePath = (origin, target) =>
    target.startsWith('google/protobuf/')
      ? path.join(REPO, 'node_modules/protobufjs', target)
      : resolve(origin, target);
  return root.loadSync(path.join(REPO, 'node_modules/steam-user/protobufs/common.proto'), {
    keepCase: true,
  });
}

const reference = referenceRoot();

function encodeWithReference(name: string, fields: Record<string, unknown>): Uint8Array {
  const type = reference.lookupType(name);
  return type.encode(type.create(fields)).finish();
}

describe('trimmed protobuf descriptor', () => {
  it('encodes a header byte-identically to Valve’s own definition', () => {
    const fields = {
      steamid: '76561198061412334',
      client_sessionid: 1234,
      jobid_source: JOBID_NONE,
      jobid_target: JOBID_NONE,
      routing_appid: 730,
    };

    expect(Array.from(encode(CMsgProtoBufHeader, fields))).toEqual(
      Array.from(encodeWithReference('CMsgProtoBufHeader', fields)),
    );
  });

  it('encodes a logon byte-identically, including the high field numbers', () => {
    // access_token is field 108 and machine_name is 96; getting either wrong
    // would produce a message Steam simply ignores.
    const fields = {
      protocol_version: 65580,
      access_token: 'eyJhbGciOi.some.token',
      should_remember_password: true,
      client_os_type: 16,
      client_language: 'english',
      machine_name: 'CS2 Inventory (browser extension)',
      supports_rate_limit_response: true,
      obfuscated_private_ip: { v4: 0 },
      chat_mode: 2,
    };

    expect(Array.from(encode(CMsgClientLogon, fields))).toEqual(
      Array.from(encodeWithReference('CMsgClientLogon', fields)),
    );
  });

  it('keeps a 64-bit SteamID exact rather than rounding it', () => {
    const steamid = '76561198061412334';
    const bytes = encode(CMsgProtoBufHeader, { steamid });
    expect(decode<{ steamid: string }>(CMsgProtoBufHeader, bytes).steamid).toBe(steamid);
  });

  it('reads a logon response produced from the reference definition', () => {
    const bytes = encodeWithReference('CMsgClientLogonResponse', {
      eresult: 1,
      heartbeat_seconds: 9,
      client_supplied_steamid: '76561198061412334',
      cell_id: 61,
      vanity_url: 'petro',
    });

    const body = decode<{
      eresult: number;
      heartbeat_seconds: number;
      client_supplied_steamid: string;
      cell_id: number;
      vanity_url: string;
    }>(CMsgClientLogonResponse, bytes);

    expect(body.eresult).toBe(1);
    expect(body.heartbeat_seconds).toBe(9);
    expect(body.client_supplied_steamid).toBe('76561198061412334');
    expect(body.cell_id).toBe(61);
    expect(body.vanity_url).toBe('petro');
  });
});

describe('net message framing', () => {
  const header = {
    steamid: '76561198061412334',
    client_sessionid: 42,
    jobid_source: JOBID_NONE,
    jobid_target: JOBID_NONE,
  };

  it('round-trips a message', () => {
    const body = new Uint8Array([1, 2, 3, 4, 5]);
    const decoded = decodeNetMessage(encodeNetMessage(EMsg.ClientLogon, header, body));

    expect(decoded.emsg).toBe(EMsg.ClientLogon);
    expect(decoded.kind).toBe('protobuf');
    expect(decoded.header.steamid).toBe('76561198061412334');
    expect(decoded.header.client_sessionid).toBe(42);
    expect(Array.from(decoded.body)).toEqual([1, 2, 3, 4, 5]);
  });

  it('sets the protobuf flag without corrupting the message id', () => {
    const framed = encodeNetMessage(EMsg.ClientLogon, header);
    const raw = new DataView(framed.buffer, framed.byteOffset, framed.byteLength).getUint32(0, true);

    expect(raw).toBe((EMsg.ClientLogon | PROTO_MASK) >>> 0);
    expect(raw).toBeGreaterThan(0x7fffffff);
    expect(decodeNetMessage(framed).emsg).toBe(EMsg.ClientLogon);
  });

  it('handles an empty body', () => {
    const decoded = decodeNetMessage(encodeNetMessage(EMsg.ClientHeartBeat, header));
    expect(decoded.body.byteLength).toBe(0);
  });

  it('decodes from a view offset into a larger buffer', () => {
    // Frames arrive as windows into a bigger ArrayBuffer, so the decoder must
    // honour byteOffset. Ignoring it would read neighbouring noise.
    const framed = encodeNetMessage(EMsg.ClientLogon, header, new Uint8Array([9, 9]));
    const pool = new Uint8Array(framed.byteLength + 64).fill(0xcd);
    pool.set(framed, 33);

    const decoded = decodeNetMessage(pool.subarray(33, 33 + framed.byteLength));
    expect(decoded.emsg).toBe(EMsg.ClientLogon);
    expect(decoded.header.steamid).toBe('76561198061412334');
    expect(Array.from(decoded.body)).toEqual([9, 9]);
  });

  it('decodes the 36-byte extended header some messages still use', () => {
    const bytes = new Uint8Array(4 + 36 + 3);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 751, true); // no proto flag
    bytes[4] = 36;
    view.setUint16(5, 2, true);
    view.setBigUint64(7, 0xffffffffffffffffn, true); // target job
    view.setBigUint64(15, 0xffffffffffffffffn, true); // source job
    bytes[23] = 239; // canary
    view.setBigUint64(24, 76561198061412334n, true);
    view.setUint32(32, 77, true);
    bytes.set([7, 7, 7], 40);

    const decoded = decodeNetMessage(bytes);
    expect(decoded.kind).toBe('extended');
    expect(decoded.emsg).toBe(751);
    expect(decoded.header.steamid).toBe('76561198061412334');
    expect(decoded.header.client_sessionid).toBe(77);
    expect(Array.from(decoded.body)).toEqual([7, 7, 7]);
  });

  it('rejects a truncated frame with a message that says why', () => {
    expect(() => decodeNetMessage(new Uint8Array([1, 2]))).toThrow(/too short/i);

    const framed = encodeNetMessage(EMsg.ClientLogon, header);
    const view = new DataView(framed.buffer, framed.byteOffset, framed.byteLength);
    view.setUint32(4, 9999, true); // header claims more than exists
    expect(() => decodeNetMessage(framed)).toThrow(/claims 9999 bytes/);
  });
});

describe('multi payloads', () => {
  function pack(messages: Uint8Array[]): Uint8Array {
    const total = messages.reduce((sum, m) => sum + 4 + m.byteLength, 0);
    const out = new Uint8Array(total);
    const view = new DataView(out.buffer);
    let offset = 0;
    for (const message of messages) {
      view.setUint32(offset, message.byteLength, true);
      out.set(message, offset + 4);
      offset += 4 + message.byteLength;
    }
    return out;
  }

  it('splits several messages out of one payload', () => {
    const parts = [new Uint8Array([1]), new Uint8Array([2, 2]), new Uint8Array([3, 3, 3])];
    expect(splitMultiPayload(pack(parts)).map((m) => Array.from(m))).toEqual([
      [1],
      [2, 2],
      [3, 3, 3],
    ]);
  });

  it('handles an empty payload', () => {
    expect(splitMultiPayload(new Uint8Array(0))).toEqual([]);
  });

  it('refuses a payload whose length prefix overruns the buffer', () => {
    const bad = new Uint8Array(8);
    new DataView(bad.buffer).setUint32(0, 999, true);
    expect(() => splitMultiPayload(bad)).toThrow(/claims 999 bytes/);
  });

  it('refuses trailing bytes rather than silently dropping them', () => {
    const packed = pack([new Uint8Array([1, 2])]);
    const withJunk = new Uint8Array(packed.byteLength + 2);
    withJunk.set(packed);
    expect(() => splitMultiPayload(withJunk)).toThrow(/trailing bytes/);
  });

  it('inflates a gzipped multi body and splits it', async () => {
    const inner = encodeNetMessage(
      EMsg.ClientLogOnResponse,
      { steamid: '76561198061412334', client_sessionid: 5 },
      encodeWithReference('CMsgClientLogonResponse', { eresult: 1, heartbeat_seconds: 9 }),
    );
    const payload = pack([inner]);

    const gzipped = new Uint8Array(
      await new Response(
        new Blob([payload as BlobPart]).stream().pipeThrough(new CompressionStream('gzip')),
      ).arrayBuffer(),
    );

    const multi = encode(CMsgMulti, {
      size_unzipped: payload.byteLength,
      message_body: gzipped,
    });
    const body = decode<{ size_unzipped: number; message_body: Uint8Array }>(CMsgMulti, multi);
    expect(body.size_unzipped).toBe(payload.byteLength);

    const expanded = await gunzip(body.message_body);
    expect(expanded.byteLength).toBe(payload.byteLength);

    const [sub] = splitMultiPayload(expanded);
    const decoded = decodeNetMessage(sub as Uint8Array);
    expect(decoded.emsg).toBe(EMsg.ClientLogOnResponse);
    expect(
      decode<{ eresult: number }>(CMsgClientLogonResponse, decoded.body).eresult,
    ).toBe(1);
  });
});

describe('server selection', () => {
  const entry = (over: Record<string, unknown> = {}) => ({
    endpoint: 'cmp1-atl3.steamserver.net:443',
    type: 'websockets',
    realm: 'steamglobal',
    load: 10,
    ...over,
  });

  it('keeps only steamglobal websockets on port 443', () => {
    const selected = selectServers([
      entry(),
      // These three are exactly what the first spike wrongly tried.
      entry({ endpoint: 'cmp2-fra1.steamserver.net:27020' }),
      entry({ endpoint: 'cmp2-fra1.steamserver.net:443', type: 'netfilter' }),
      entry({ endpoint: 'cmp3-fra1.steamserver.net:443', realm: 'steamchina' }),
    ]);

    expect(selected.map((s) => s.endpoint)).toEqual(['cmp1-atl3.steamserver.net:443']);
  });

  it('puts the least loaded server first', () => {
    const selected = selectServers([
      entry({ endpoint: 'busy.steamserver.net:443', load: 90 }),
      entry({ endpoint: 'quiet.steamserver.net:443', load: 3 }),
    ]);
    expect(selected.map((s) => s.endpoint)).toEqual([
      'quiet.steamserver.net:443',
      'busy.steamserver.net:443',
    ]);
  });

  it('accepts the directory as an object as well as an array', () => {
    expect(selectServers({ 0: entry() })).toHaveLength(1);
    expect(selectServers(undefined)).toEqual([]);
    expect(selectServers(null)).toEqual([]);
  });

  it('builds the socket URL Steam expects', () => {
    expect(cmSocketUrl('cmp1-atl3.steamserver.net:443')).toBe(
      'wss://cmp1-atl3.steamserver.net:443/cmsocket/',
    );
  });
});

describe('steam session exchange', () => {
  it('reads the session out of the token endpoint reply', () => {
    const session = parseClientJsToken({
      logged_in: true,
      steamid: '76561198061412334',
      account_name: 'petro',
      token: 'short-lived-nonce',
    });

    expect(session).toEqual({
      steamId: '76561198061412334',
      accountName: 'petro',
      webLogonToken: 'short-lived-nonce',
    });
  });

  it('says plainly when the browser is not signed in to Steam', () => {
    expect(() => parseClientJsToken({ logged_in: false })).toThrow(/not signed in/i);
    expect(() => parseClientJsToken({})).toThrow(/not signed in/i);
    expect(() => parseClientJsToken(null)).toThrow(/not signed in/i);
  });

  it('does not pretend to have a session when the token is missing', () => {
    // Signed in, but Steam gave us nothing usable -- a different problem from
    // not being signed in, and worth a different message.
    expect(() => parseClientJsToken({ logged_in: true, steamid: '765' })).toThrow(
      /no logon token/i,
    );
    expect(() => parseClientJsToken({ logged_in: true, token: 'abc' })).toThrow(/no logon token/i);
  });

  it('tolerates a missing account name', () => {
    const session = parseClientJsToken({ logged_in: true, steamid: '765', token: 'abc' });
    expect(session.accountName).toBe('');
  });

  it('fetches from the chat token endpoint with the session attached', async () => {
    const seen: string[] = [];
    const session = await readSteamSession(async (url) => {
      seen.push(url);
      return { logged_in: true, steamid: '765', account_name: 'petro', token: 'abc' };
    });

    expect(seen).toEqual(['https://steamcommunity.com/chat/clientjstoken']);
    expect(session.webLogonToken).toBe('abc');
  });
});

describe('web logon message', () => {
  it('sends the web OS type and UI mode, and none of the desktop fields', () => {
    // A web logon token needs a different shape from a password logon. Sending
    // the desktop fields anyway is a way to be refused, so this pins the set.
    const fields = {
      protocol_version: 65580,
      web_logon_nonce: 'short-lived-nonce',
      account_name: 'petro',
      client_os_type: 4294966596,
      ui_mode: 4,
      chat_mode: 2,
    };

    expect(Array.from(encode(CMsgClientLogon, fields))).toEqual(
      Array.from(encodeWithReference('CMsgClientLogon', fields)),
    );
  });

  it('refuses a misspelled field instead of silently dropping it', () => {
    expect(() => encode(CMsgClientLogon, { web_logon_nonce_typo: 'x' })).toThrow(
      /unknown field web_logon_nonce_typo/,
    );
  });
});
