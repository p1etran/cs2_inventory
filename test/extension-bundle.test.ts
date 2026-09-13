import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Checks the extension as it is actually shipped, not as its source reads.
 *
 * A bundler may rename anything that is not an export. esbuild emits the
 * generated `CMsgClientHello` class as `CMsgClientHello2`, so any code that
 * looks a message up by `type.name` finds nothing once bundled -- which is how
 * the unknown-field guard came to be silently inert in every build while its
 * unit test passed, because vitest loads modules unbundled.
 *
 * So these tests bundle first and then exercise the output. Anything that
 * depends on a runtime name surviving the build belongs here.
 */

const EXT = path.resolve(import.meta.dirname, '../extension');
const workdir = mkdtempSync(path.join(tmpdir(), 'cs2-bundle-'));

afterAll(() => rmSync(workdir, { recursive: true, force: true }));

/** Bundles a snippet the same way `extension/scripts/build.mjs` does. */
async function bundled<T>(source: string): Promise<T> {
  const entry = path.join(workdir, `entry-${Math.random().toString(36).slice(2)}.ts`);
  const outfile = `${entry}.bundle.mjs`;
  writeFileSync(entry, source);

  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'chrome116',
    minify: false,
    logLevel: 'silent',
  });

  return (await import(pathToFileURL(outfile).href)) as T;
}

const PROTOS = path.join(EXT, 'src/steam/protos.ts').replace(/\\/g, '/');

describe('the bundled extension', () => {
  it('still rejects a misspelled protobuf field', async () => {
    const mod = await bundled<{
      run: (fields: Record<string, unknown>) => Uint8Array;
    }>(`
      import { CMsgCasketItem, encode } from '${PROTOS}';
      export const run = (fields) => encode(CMsgCasketItem, fields);
    `);

    expect(() => mod.run({ casket_item_typo: '1' })).toThrow(/unknown field casket_item_typo/);
    // And the correct spelling still encodes, so the guard is not simply
    // rejecting everything.
    expect(mod.run({ casket_item_id: '1', item_item_id: '1' }).length).toBeGreaterThan(0);
  }, 30_000);

  it('names the message correctly in the error, despite renaming', async () => {
    const mod = await bundled<{ run: () => void; className: string }>(`
      import { CMsgClientHello, encode } from '${PROTOS}';
      export const run = () => encode(CMsgClientHello, { nonsense: 1 });
      export const className = CMsgClientHello.name;
    `);

    // The rename is real; this asserts the guard copes with it rather than
    // that it does not happen.
    expect(mod.className).not.toBe('CMsgClientHello');
    expect(() => mod.run()).toThrow(/^CMsgClientHello: unknown field nonsense/);
  }, 30_000);

  it('has a field list for every message it exports', async () => {
    const mod = await bundled<{ missing: () => string[] }>(`
      import * as generated from '${path.join(EXT, 'src/generated/protos.js').replace(/\\/g, '/')}';
      import { encode } from '${PROTOS}';
      export const missing = () => {
        const bad = [];
        for (const [name, type] of Object.entries(generated)) {
          if (typeof type?.encode !== 'function') continue;
          try {
            encode(type, { definitely_not_a_field: 1 });
            bad.push(name + ' (accepted a typo)');
          } catch (error) {
            if (/No field list/.test(error.message)) bad.push(name + ' (no field list)');
          }
        }
        return bad;
      };
    `);

    expect(mod.missing()).toEqual([]);
  }, 30_000);
});
