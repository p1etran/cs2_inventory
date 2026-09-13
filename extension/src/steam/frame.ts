import { CMsgProtoBufHeader, decode, encode } from './protos.js';

/**
 * Steam net message framing.
 *
 * Over a WebSocket each binary frame is exactly one net message, with no
 * length prefix, because the WebSocket already carries message boundaries.
 * A message is an EMsg, a header, then the body:
 *
 *   uint32  emsg | 0x80000000        the high bit marks a protobuf header
 *   uint32  header length
 *   bytes   CMsgProtoBufHeader
 *   bytes   body
 *
 * Two older header shapes still turn up, so both are decoded: the tiny header
 * used while setting up channel encryption, and the fixed 36-byte extended
 * header. We never send either -- everything we send is protobuf -- but
 * failing to read one would look like a corrupt stream rather than the
 * unexpected-but-harmless message it is.
 */

/** High bit of the EMsg word, set when the header is a protobuf. */
export const PROTO_MASK = 0x80000000;
const EMSG_MASK = 0x7fffffff;

/** Steam's "no job" sentinel, 2^64-1. */
export const JOBID_NONE = '18446744073709551615';

const ENCRYPTION_EMSGS = new Set([1303, 1304, 1305]);
const EXTENDED_HEADER_LENGTH = 36;

export type HeaderKind = 'protobuf' | 'extended' | 'encryption';

export interface MessageHeader {
  steamid?: string;
  client_sessionid?: number;
  jobid_source?: string;
  jobid_target?: string;
  target_job_name?: string;
  routing_appid?: number;
  eresult?: number;
  /** Set on a service reply that failed, and worth showing verbatim. */
  error_message?: string;
  /** 1 for the public Steam realm. Service calls are refused without it. */
  realm?: number;
}

export interface DecodedMessage {
  emsg: number;
  kind: HeaderKind;
  header: MessageHeader;
  body: Uint8Array;
}

/** A view that respects the offset, since these are often windows into a pool. */
function viewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function encodeNetMessage(
  emsg: number,
  header: MessageHeader,
  body: Uint8Array = new Uint8Array(0),
): Uint8Array {
  const headerBytes = encode(CMsgProtoBufHeader, header as Record<string, unknown>);

  const out = new Uint8Array(8 + headerBytes.length + body.length);
  const view = viewOf(out);
  // `>>> 0` keeps the value unsigned; setUint32 would otherwise see a negative.
  view.setUint32(0, (emsg | PROTO_MASK) >>> 0, true);
  view.setUint32(4, headerBytes.length, true);
  out.set(headerBytes, 8);
  out.set(body, 8 + headerBytes.length);
  return out;
}

export function decodeNetMessage(bytes: Uint8Array): DecodedMessage {
  if (bytes.byteLength < 4) {
    throw new Error(`Net message too short to hold an EMsg (${bytes.byteLength} bytes)`);
  }

  const view = viewOf(bytes);
  const raw = view.getUint32(0, true);
  const emsg = raw & EMSG_MASK;
  const isProtobuf = (raw & PROTO_MASK) !== 0;

  if (isProtobuf) {
    if (bytes.byteLength < 8) {
      throw new Error(`Protobuf message ${emsg} has no header length`);
    }
    const headerLength = view.getUint32(4, true);
    const headerEnd = 8 + headerLength;
    if (headerEnd > bytes.byteLength) {
      throw new Error(
        `Protobuf header for message ${emsg} claims ${headerLength} bytes, only ${bytes.byteLength - 8} remain`,
      );
    }
    return {
      emsg,
      kind: 'protobuf',
      header: decode<MessageHeader>(CMsgProtoBufHeader, bytes.subarray(8, headerEnd)),
      body: bytes.subarray(headerEnd),
    };
  }

  // Encryption setup: just two job ids. Should never appear over TLS, but it
  // is cheap to read and tells us plainly what happened if it ever does.
  if (ENCRYPTION_EMSGS.has(emsg)) {
    return { emsg, kind: 'encryption', header: {}, body: bytes.subarray(4 + 16) };
  }

  if (bytes.byteLength < 4 + EXTENDED_HEADER_LENGTH) {
    throw new Error(`Message ${emsg} is too short for an extended header`);
  }
  // Extended header layout: 1 byte size, 2 bytes version, 8 target job,
  // 8 source job, 1 byte canary, 8 steamid, 4 session id.
  const steamid = view.getBigUint64(4 + 1 + 2 + 8 + 8 + 1, true).toString();
  const sessionId = view.getUint32(4 + 1 + 2 + 8 + 8 + 1 + 8, true);
  return {
    emsg,
    kind: 'extended',
    header: { steamid, client_sessionid: sessionId },
    body: bytes.subarray(4 + EXTENDED_HEADER_LENGTH),
  };
}

/**
 * Splits a Multi payload into the messages it carries.
 *
 * The payload is a run of length-prefixed messages: `uint32` size, then that
 * many bytes, repeated until exhausted.
 */
export function splitMultiPayload(payload: Uint8Array): Uint8Array[] {
  const view = viewOf(payload);
  const messages: Uint8Array[] = [];
  let offset = 0;

  while (offset + 4 <= payload.byteLength) {
    const size = view.getUint32(offset, true);
    offset += 4;
    if (size === 0) continue;
    if (offset + size > payload.byteLength) {
      throw new Error(
        `Multi sub-message claims ${size} bytes, only ${payload.byteLength - offset} remain`,
      );
    }
    messages.push(payload.subarray(offset, offset + size));
    offset += size;
  }

  if (offset !== payload.byteLength) {
    throw new Error(`Multi payload has ${payload.byteLength - offset} trailing bytes`);
  }
  return messages;
}

/**
 * Inflates a gzipped Multi body using the platform's own decompressor, so no
 * zlib implementation has to be bundled.
 */
export async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
