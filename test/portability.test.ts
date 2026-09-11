import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

/**
 * The shared core has to keep running in a browser, because the extension
 * bundles it directly rather than reimplementing item naming and
 * reconciliation. Nothing about that is enforced by the type checker: a stray
 * `Buffer.from` or `node:path` import would pass `tsc` happily and only fail
 * once loaded in a browser.
 *
 * So this bundles `src/core.ts` for the browser and lets esbuild be the judge.
 * With no `platform: 'node'` and no shims configured, a Node built-in import
 * is a hard error, and referencing a Node global leaves a trace in the output.
 */
async function bundleCoreForBrowser(): Promise<string> {
  const result = await build({
    entryPoints: ['src/core.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    // Anything unresolvable must fail rather than be quietly stubbed out.
    external: [],
    logLevel: 'silent',
  });
  return result.outputFiles[0]?.text ?? '';
}

describe('shared core', () => {
  it('bundles for the browser with no Node dependencies', async () => {
    // esbuild rejects `node:*` imports for a browser build, so reaching this
    // line at all is most of the assertion.
    const code = await bundleCoreForBrowser();
    expect(code.length).toBeGreaterThan(0);

    for (const forbidden of [
      'node:fs',
      'node:path',
      'node:crypto',
      'node:readline',
      'node:stream',
      'node:string_decoder',
      'better-sqlite3',
      'steam-user',
      'globaloffensive',
      'steam-session',
    ]) {
      expect(code, `core must not pull in ${forbidden}`).not.toContain(forbidden);
    }
  }, 30000);

  it('does not reach for Node globals', async () => {
    const code = await bundleCoreForBrowser();

    // Buffer was the one real offender here: reading econ attributes used to
    // go through Buffer.readUInt32LE, which a browser has no answer for.
    expect(code).not.toMatch(/\bBuffer\s*\./);
    expect(code).not.toMatch(/\bprocess\s*\.\s*env\b/);
    expect(code).not.toMatch(/\b__dirname\b/);
    expect(code).not.toMatch(/\brequire\s*\(/);
  }, 30000);

  it('exports the pieces the extension needs', async () => {
    const core = await import('../src/core.js');

    // Naming and reconciliation: the logic worth not writing twice.
    expect(typeof core.normalizeEconItem).toBe('function');
    expect(typeof core.buildMarketHashName).toBe('function');
    expect(typeof core.wearName).toBe('function');
    expect(typeof core.searchKey).toBe('function');
    expect(typeof core.diffPlacements).toBe('function');
    expect(typeof core.buildCatalogIndex).toBe('function');
    expect(typeof core.Catalog).toBe('function');
    expect(typeof core.emptyCatalogIndex).toBe('function');
    expect(core.ATTR.CASKET_ID_LOW).toBe(272);
    expect(core.DEF.STORAGE_UNIT).toBe(1201);
  });
});
