import descriptor from '../generated/protos.json';
import type { StaticMessageType } from '../generated/protos.js';

export {
  CMsgClientAccountInfo,
  CMsgClientGamesPlayed,
  CMsgClientHeartBeat,
  CMsgClientLoggedOff,
  CMsgClientLogon,
  CMsgClientLogonResponse,
  CMsgGCClient,
  CMsgMulti,
  CMsgProtoBufHeader,
} from '../generated/protos.js';

/**
 * Encoding and decoding for the protobuf messages the extension speaks.
 *
 * Everything under `src/generated` is produced by
 * `extension/scripts/gen-protos.mjs` from Valve's own .proto files. Do not
 * hand-edit it: field numbers and wire types have to match exactly, and
 * several are not what you would guess -- `steamid` is a `fixed64`, and the
 * refresh token goes in `access_token`, field 108.
 *
 * `protos.js` is a *static* module rather than a descriptor loaded at runtime,
 * and that is not a size optimisation. protobufjs builds its codecs by calling
 * `Function(source)`, and an extension page runs under a Content Security
 * Policy of `script-src 'self'` with no `unsafe-eval`, so a runtime-loaded
 * descriptor throws the first time anything is encoded. This was found by
 * loading the extension, not by reading about it.
 *
 * `protos.json` comes along too, but only as the list of valid field names for
 * the guard below. It is never used to build a codec.
 */

interface DescriptorTree {
  nested?: Record<string, { fields?: Record<string, unknown> }>;
}

/** Field names per message, read off the descriptor rather than duplicated. */
const FIELD_NAMES = new Map<string, Set<string>>(
  Object.entries((descriptor as DescriptorTree).nested ?? {}).map(([name, type]) => [
    name,
    new Set(Object.keys(type.fields ?? {})),
  ]),
);

/**
 * Encodes a message from a plain object.
 *
 * `fromObject` rather than `create`, because ids past 2^53 are passed around
 * as strings and only `fromObject` turns a string into the Long a 64-bit field
 * needs. `create` would hand the encoder a raw string, which fails.
 *
 * Unknown field names are rejected rather than ignored. protobufjs silently
 * drops a key it does not recognise, so a typo would send a message missing
 * that value, and the mistake would surface only as Steam behaving oddly.
 */
export function encode(type: StaticMessageType, fields: Record<string, unknown>): Uint8Array {
  const known = FIELD_NAMES.get(type.name);
  if (known) {
    const unknown = Object.keys(fields).filter((key) => !known.has(key));
    if (unknown.length > 0) {
      throw new Error(
        `${type.name}: unknown field${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')}`,
      );
    }
  }
  return type.encode(type.fromObject(fields)).finish();
}

/**
 * Decodes a message to a plain object. 64-bit fields come back as strings, not
 * Long objects or numbers, because an asset id or a casket id is past 2^53 and
 * must not be rounded anywhere.
 */
export function decode<T = Record<string, unknown>>(
  type: StaticMessageType,
  bytes: Uint8Array,
): T {
  return type.toObject(type.decode(bytes), {
    longs: String,
    enums: Number,
    bytes: Uint8Array,
    defaults: false,
  }) as T;
}
