/**
 * Builds the extension and zips it for the Chrome Web Store.
 *
 * Checks the things a store submission fails on and a local load does not: a
 * manifest that names a file it does not ship, an icon missing at one size, a
 * permission the code never uses. Finding those after an upload costs a review
 * cycle, which is measured in days.
 *
 * Run: node extension/scripts/pack.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const EXT = path.resolve(import.meta.dirname, '..');
const REPO = path.resolve(EXT, '..');
const DIST = path.join(EXT, 'dist');
const OUT = path.join(EXT, 'build');

// Build first, so the zip can never be of a stale dist.
execFileSync(process.execPath, [path.join(EXT, 'scripts/build.mjs')], { stdio: 'inherit' });

const manifest = JSON.parse(readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
const problems = [];

/** Every file the manifest points at has to actually be in the zip. */
const referenced = [
  manifest.background?.service_worker,
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action?.default_icon ?? {}),
].filter(Boolean);

for (const file of referenced) {
  if (!existsSync(path.join(DIST, file))) problems.push(`manifest names ${file}, which is not in dist`);
}

// The page is not named in the manifest -- the service worker opens it -- so
// it would go missing without a word.
for (const file of ['app.html', 'app.js', 'style.css', 'extra.css']) {
  if (!existsSync(path.join(DIST, file))) problems.push(`${file} is missing from dist`);
}

for (const size of ['16', '32', '48', '128']) {
  if (!manifest.icons?.[size]) problems.push(`no ${size}px icon declared`);
}

/**
 * A permission the code never mentions is one a reviewer will ask about, and
 * rightly. This is a grep, not a proof -- it catches the permission left
 * behind after a rewrite, which is the case that actually happens.
 */
const source = readdirSync(path.join(EXT, 'src'), { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts'))
  .map((file) => readFileSync(path.join(EXT, 'src', file), 'utf8'))
  .join('\n');

const USED_BY = {
  storage: /chrome\.storage/,
  unlimitedStorage: /chrome\.storage\.local/,
  declarativeNetRequestWithHostAccess: /declarativeNetRequest/,
};
for (const permission of manifest.permissions ?? []) {
  const pattern = USED_BY[permission];
  if (!pattern) {
    problems.push(`permission "${permission}" is not accounted for in pack.mjs`);
  } else if (!pattern.test(source)) {
    problems.push(`permission "${permission}" is declared but nothing in src uses it`);
  }
}

if (problems.length > 0) {
  console.error('\nNot packable:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const zipPath = path.join(OUT, `cs2-inventory-${manifest.version}.zip`);
rmSync(zipPath, { force: true });

// -X drops extended attributes, which vary by machine and would otherwise make
// two builds of the same source produce different bytes.
execFileSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: DIST });

const size = statSync(zipPath).size;
console.log(`\n${path.relative(REPO, zipPath)}  ${(size / 1024).toFixed(0)} kB`);
console.log(`version ${manifest.version}, ${referenced.length} declared files present`);
console.log(`permissions: ${(manifest.permissions ?? []).join(', ')}`);
console.log(`hosts: ${(manifest.host_permissions ?? []).join(', ')}`);
