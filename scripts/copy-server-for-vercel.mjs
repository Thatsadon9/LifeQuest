/**
 * Copy server + shared src into api/ for Vercel serverless bundling.
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function resetDir(path: string) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

const serverSrc = resolve(root, 'server');
const serverDest = resolve(root, 'api', '_server');
const libDest = resolve(root, 'api', 'src', 'lib');
const typesDest = resolve(root, 'api', 'src', 'types');

if (!existsSync(serverSrc)) {
  console.error('Missing server/ directory');
  process.exit(1);
}

resetDir(serverDest);
cpSync(serverSrc, serverDest, { recursive: true });

resetDir(libDest);
cpSync(resolve(root, 'src', 'lib'), libDest, { recursive: true });

resetDir(typesDest);
cpSync(resolve(root, 'src', 'types'), typesDest, { recursive: true });

console.log('Prepared api/_server and api/src for Vercel');
