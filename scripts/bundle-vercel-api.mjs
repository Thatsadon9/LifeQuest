/**
 * Bundle Vercel API handlers with esbuild (server code inlined for serverless).
 */
import * as esbuild from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  logLevel: 'info',
  external: ['@neondatabase/serverless'],
};

await esbuild.build({
  ...shared,
  entryPoints: [resolve(root, 'scripts/vercel-auth-entry.ts')],
  outfile: resolve(root, 'api/catchall.js'),
});

await esbuild.build({
  ...shared,
  entryPoints: [resolve(root, 'scripts/vercel-sync-entry.ts')],
  outfile: resolve(root, 'api/sync.js'),
});

console.log('Bundled api/catchall.js and api/sync.js for Vercel');
