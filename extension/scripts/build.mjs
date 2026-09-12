/**
 * Bundles the extension into extension/dist, ready to load unpacked.
 *
 * Nothing is minified: the whole trust argument rests on a reader being able
 * to check that the built extension does what the source says, so the output
 * stays legible and the build stays reproducible.
 */
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const EXT = path.resolve(import.meta.dirname, '..');
const REPO = path.resolve(EXT, '..');
const DIST = path.join(EXT, 'dist');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const result = await build({
  entryPoints: {
    app: path.join(EXT, 'src/app.ts'),
    background: path.join(EXT, 'src/background.ts'),
  },
  outdir: DIST,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome116',
  // Legible on purpose; see the note above.
  minify: false,
  sourcemap: true,
  logLevel: 'info',
  metafile: true,
});

cpSync(path.join(EXT, 'manifest.json'), path.join(DIST, 'manifest.json'));
cpSync(path.join(EXT, 'src/app.html'), path.join(DIST, 'app.html'));
cpSync(path.join(EXT, 'src/extra.css'), path.join(DIST, 'extra.css'));
// Shared with the local server's UI rather than copied and edited, so the two
// front ends cannot drift apart.
cpSync(path.join(REPO, 'web/style.css'), path.join(DIST, 'style.css'));

for (const [file, meta] of Object.entries(result.metafile.outputs)) {
  if (file.endsWith('.js')) {
    console.log(`${path.basename(file).padEnd(16)} ${(meta.bytes / 1024).toFixed(1)} kB`);
  }
}
console.log('\nLoad extension/dist as an unpacked extension.');
