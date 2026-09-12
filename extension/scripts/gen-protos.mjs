/**
 * Generates a trimmed protobuf descriptor for the extension.
 *
 * The field numbers and wire types here have to match Valve's exactly, and
 * some are easy to get wrong by eye -- `steamid` and the job ids in
 * CMsgProtoBufHeader are `fixed64`, not varints, and the job ids default to
 * 2^64-1 rather than 0. So rather than transcribe anything, this parses the
 * real .proto files that ship inside steam-user and globaloffensive and emits
 * only the messages we use, plus whatever those transitively reference.
 *
 * Shipping the untrimmed descriptors would mean roughly 400 KB of JSON for a
 * few dozen fields we actually touch.
 *
 * Run: node extension/scripts/gen-protos.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import protobuf from 'protobufjs';

const require = createRequire(import.meta.url);

const REPO = path.resolve(import.meta.dirname, '../..');
const DESCRIPTOR = path.join(REPO, 'extension/src/generated/protos.json');
const STATIC_MODULE = path.join(REPO, 'extension/src/generated/protos.js');
const EMSG_NAMES = path.join(REPO, 'extension/src/generated/emsg-names.json');

/** Every message the extension encodes or decodes, by source file. */
const SOURCES = [
  {
    file: 'node_modules/steam-user/protobufs/common.proto',
    messages: [
      // Transport
      'CMsgProtoBufHeader',
      'CMsgMulti',
      // Logon
      'CMsgClientLogon',
      'CMsgClientLogonResponse',
      'CMsgClientLoggedOff',
      'CMsgClientHeartBeat',
      // Carries the persona name, which makes a successful logon legible
      'CMsgClientAccountInfo',
      // Launching CS2 so the game coordinator will talk to us
      'CMsgClientGamesPlayed',
      // A fresh session is Offline, and the Node client goes Online before
      // reporting a game, so do the same rather than differ for no reason
      'CMsgClientChangeStatus',
      // How Steam reports whether we actually got the game slot. Without this
      // a games-played that does not take effect is indistinguishable from a
      // game coordinator that is merely slow.
      'CMsgClientPlayingSessionState',
      'CMsgClientKickPlayingSession',
      // The envelope every game-coordinator message travels in
      'CMsgGCClient',
    ],
  },
  {
    // The game coordinator's own messages. globaloffensive ships these, and
    // its protobufs directory has google/protobuf alongside them already.
    file: 'node_modules/globaloffensive/protobufs/gcsdk_gcmessages.proto',
    messages: [
      'CMsgClientHello',
      'CMsgClientWelcome',
      // The shared-object cache: how the GC hands over the inventory
      'CMsgSOCacheSubscribed',
      'CMsgSOSingleObject',
      'CMsgSOMultipleObjects',
    ],
  },
  {
    file: 'node_modules/globaloffensive/protobufs/base_gcmessages.proto',
    // One econ item, exactly as src/domain/econ.ts already expects to read it
    messages: ['CSOEconItem'],
  },
  {
    file: 'node_modules/globaloffensive/protobufs/econ_gcmessages.proto',
    messages: ['CMsgCasketItem', 'CMsgGCItemCustomizationNotification'],
  },
];

/**
 * Collects a message and everything it references, following field types and
 * nested declarations. Without this closure a decode would fail at runtime on
 * the first nested message, which is a poor way to find out.
 */
function collect(type, seen) {
  if (!type || seen.has(type.fullName)) return;
  seen.add(type.fullName);

  if (type.fieldsArray) {
    for (const field of type.fieldsArray) {
      field.resolve();
      if (field.resolvedType) collect(field.resolvedType, seen);
    }
  }
  for (const nested of type.nestedArray ?? []) {
    collect(nested, seen);
  }
}

/** Places a type's JSON at its fully-qualified path in a descriptor tree. */
function place(tree, fullName, json) {
  const parts = fullName.replace(/^\./, '').split('.');
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    node.nested ??= {};
    node.nested[part] ??= {};
    node = node.nested[part];
  }
  node.nested ??= {};
  node.nested[parts[parts.length - 1]] = json;
}

const tree = {};
let count = 0;

/**
 * Valve's protos import google/protobuf/descriptor.proto to declare custom
 * options. steam-user does not ship a copy next to them, so point that one
 * import at protobufjs's own. The options themselves are irrelevant to us --
 * only the message definitions matter.
 */
function rootForFile() {
  const root = new protobuf.Root();
  const resolve = root.resolvePath.bind(root);
  root.resolvePath = (origin, target) =>
    target.startsWith('google/protobuf/')
      ? path.join(REPO, 'node_modules/protobufjs', target)
      : resolve(origin, target);
  return root;
}

/** 64-bit wire types, whose proto2 defaults cannot survive a JS number. */
const SIXTY_FOUR_BIT = new Set(['fixed64', 'sfixed64', 'uint64', 'int64', 'sint64']);

/**
 * Drops proto2 defaults on 64-bit fields.
 *
 * protobufjs parses `[default = 18446744073709551615]` into a JS number, which
 * rounds it to 18446744073709552000 -- so the emitted descriptor would carry a
 * value that is simply not the one Valve wrote. Nothing here relies on those
 * defaults (job ids are always set explicitly), so removing them is better
 * than shipping a wrong number that might get used one day.
 */
function stripLongDefaults(json) {
  for (const field of Object.values(json.fields ?? {})) {
    if (SIXTY_FOUR_BIT.has(field.type) && field.options?.default !== undefined) {
      delete field.options.default;
      if (Object.keys(field.options).length === 0) delete field.options;
    }
  }
  for (const nested of Object.values(json.nested ?? {})) {
    stripLongDefaults(nested);
  }
  return json;
}

for (const source of SOURCES) {
  // keepCase so the descriptor uses Valve's own field names and the calling
  // code reads the same as the .proto it came from.
  const root = rootForFile().loadSync(path.join(REPO, source.file), { keepCase: true });
  root.resolveAll();

  const seen = new Set();
  for (const name of source.messages) {
    const type = root.lookup(name);
    if (!type) throw new Error(`${name} not found in ${source.file}`);
    collect(type, seen);
  }

  for (const fullName of seen) {
    const type = root.lookup(fullName);
    // Nested types come along inside their parent's JSON, so skip them here.
    if (type.parent && seen.has(type.parent.fullName) && type.parent.fullName !== '') continue;
    place(tree, fullName, stripLongDefaults(type.toJSON()));
    count += 1;
  }
}

mkdirSync(path.dirname(DESCRIPTOR), { recursive: true });
writeFileSync(DESCRIPTOR, `${JSON.stringify(tree, null, 2)}\n`);
console.log(`${count} types -> protos.json (${(JSON.stringify(tree).length / 1024).toFixed(1)} kB)`);

/**
 * The full EMsg number-to-name table, from steam-user's enum.
 *
 * Steam does not report an unrecognised message, so a protocol mistake shows
 * up as silence rather than an error -- which is exactly how a games-played
 * sent as the wrong EMsg cost two rounds of guessing. Being able to name every
 * message that arrives is what turns that kind of silence into a diagnosis, so
 * the whole table ships rather than the handful we happen to handle.
 */
const emsgNames = Object.fromEntries(
  Object.entries(require('steam-user/enums/EMsg.js'))
    // The enum is bidirectional; keep the number -> name direction only.
    .filter(([key, value]) => /^\d+$/.test(key) && typeof value === 'string')
    .sort(([a], [b]) => Number(a) - Number(b)),
);
writeFileSync(EMSG_NAMES, `${JSON.stringify(emsgNames, null, 1)}\n`);
console.log(
  `${Object.keys(emsgNames).length} EMsg names -> emsg-names.json` +
    ` (${(JSON.stringify(emsgNames).length / 1024).toFixed(1)} kB)`,
);

/**
 * Compile the descriptor into a static module.
 *
 * This is not an optimisation. protobufjs builds its codecs at runtime with
 * `Function(source)`, and an extension page runs under a Content Security
 * Policy of `script-src 'self'` -- no `unsafe-eval` -- so loading a descriptor
 * at runtime throws the moment a message is encoded. A static module contains
 * plain encode/decode functions instead and needs no eval at all.
 *
 * `--no-verify` because callers pass already-shaped objects; `--no-delimited`
 * because Steam never uses that framing. Comments are kept out to hold the
 * size down, but the output is left unminified so it stays readable.
 */
function pb(tool, args) {
  execFileSync(
    process.execPath,
    [path.join(REPO, `node_modules/protobufjs-cli/bin/${tool}`), ...args],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
}

pb('pbjs', [
  '-t', 'static-module',
  '-w', 'es6',
  '--keep-case',
  '--no-verify',
  '--no-delimited',
  '--no-comments',
  '-o', STATIC_MODULE,
  DESCRIPTOR,
]);
/**
 * Declarations for the static module.
 *
 * pbts is no help here: against an es6 static module it emits little more than
 * a couple of imports. The generated classes all share one shape, so declaring
 * that shape once and listing the exports gives a typed import boundary and
 * stays in step with the whitelist above.
 */
const exported = [...new Set(SOURCES.flatMap((source) => source.messages))].sort();
const declarations = `// Generated by extension/scripts/gen-protos.mjs. Do not edit.

/** The shape pbjs generates for every message in a static module. */
export interface StaticMessageType {
  readonly name: string;
  encode(message: unknown): { finish(): Uint8Array };
  decode(reader: Uint8Array, length?: number): unknown;
  fromObject(object: Record<string, unknown>): unknown;
  toObject(message: unknown, options?: Record<string, unknown>): Record<string, unknown>;
}

${exported.map((name) => `export const ${name}: StaticMessageType;`).join('\n')}
`;
writeFileSync(path.join(REPO, 'extension/src/generated/protos.d.ts'), declarations);

console.log(`wrote extension/src/generated/protos.js and declarations for ${exported.length} messages`);
