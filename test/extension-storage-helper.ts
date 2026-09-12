/**
 * A stand-in for `chrome.storage.local`.
 *
 * Round-trips through JSON exactly as the real one does, which is not a
 * detail: it is why the machine id is stored as an array of numbers rather
 * than a Uint8Array, and a fake that kept object identity would hide that
 * class of bug entirely.
 */
export function installChromeStorage(): { data: Record<string, unknown> } {
  const data: Record<string, unknown> = {};

  const local = {
    get: (key: string) =>
      Promise.resolve(key in data ? { [key]: JSON.parse(JSON.stringify(data[key])) } : {}),
    set: (values: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(values)) {
        data[key] = JSON.parse(JSON.stringify(value));
      }
      return Promise.resolve();
    },
    remove: (key: string) => {
      delete data[key];
      return Promise.resolve();
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } };
  return { data };
}
