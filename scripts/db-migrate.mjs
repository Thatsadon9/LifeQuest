/**
 * Apply server/db/schema.sql to the Neon database in DATABASE_URL.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv(resolve(root, '.env'));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const schemaPath = resolve(root, 'server', 'db', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf8');
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);

for (const statement of statements) {
  await sql.query(statement);
  const preview = statement.split('\n')[0].slice(0, 72);
  console.log('OK:', preview);
}

console.log(`Applied ${statements.length} statements from schema.sql`);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
