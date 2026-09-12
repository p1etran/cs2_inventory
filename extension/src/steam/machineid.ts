/**
 * The machine ID a Steam client sends with a logon.
 *
 * It is a binary KV object -- root key `MessageObject`, three SHA-1 hashes
 * named BB3, FF2 and 3B3 -- and steam-user builds exactly this shape in
 * `components/09-logon.js:876`. A logged-on client that omits it is not quite
 * the thing Steam expects, so it is sent rather than left out.
 *
 * The value is random once and then kept, which is what it is for: Steam uses
 * it to recognise the same device across sign-ins. A fresh one every time would
 * look like a new machine on every connection.
 */

const KEY = 'machineId';

/** Hex SHA-1, the only hash this blob uses. */
async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Appends a NUL-terminated string, the encoding binary KV uses throughout. */
function pushCString(out: number[], value: string): void {
  for (const byte of new TextEncoder().encode(value)) out.push(byte);
  out.push(0);
}

/**
 * Builds the blob from three seed strings.
 *
 * Exported so it can be checked byte-for-byte against steam-user's own
 * `createMachineID`, which is the only way to know this hand-rolled serialiser
 * is right -- Steam does not complain about a malformed one, it just treats
 * the client differently.
 */
export async function buildMachineId(
  bb3: string,
  ff2: string,
  threeB3: string,
): Promise<Uint8Array> {
  const out: number[] = [];
  out.push(0); // MessageObject follows
  pushCString(out, 'MessageObject');

  for (const [name, seed] of [
    ['BB3', bb3],
    ['FF2', ff2],
    ['3B3', threeB3],
  ] as const) {
    out.push(1); // a string value follows
    pushCString(out, name);
    pushCString(out, await sha1Hex(seed));
  }

  out.push(8); // end of the object
  out.push(8); // end of the document
  return new Uint8Array(out);
}

/** The saved machine ID, generating and storing one on first use. */
export async function machineId(): Promise<Uint8Array> {
  const stored = await chrome.storage.local.get(KEY);
  const saved = stored[KEY] as number[] | undefined;
  if (Array.isArray(saved) && saved.length > 0) return new Uint8Array(saved);

  const random = () => crypto.randomUUID();
  const built = await buildMachineId(random(), random(), random());
  // Stored as an array because chrome.storage serialises to JSON, which turns
  // a Uint8Array into an object keyed by index.
  await chrome.storage.local.set({ [KEY]: [...built] });
  return built;
}
