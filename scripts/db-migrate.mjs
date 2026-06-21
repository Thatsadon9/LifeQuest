/**
 * Apply server/db/schema.sql and migrations to Neon Postgres.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

const sql = neon(url);

async function dropLegacyGameTables() {
  const rows = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile'
  `;
  const cols = rows.map((r) => String(r.column_name));
  const isLegacy = cols.includes('id') && !cols.includes('user_id');
  if (!isLegacy) return;

  console.log('Legacy schema detected — dropping single-tenant game tables…');
  const drops = [
    'DROP TABLE IF EXISTS completions CASCADE',
    'DROP TABLE IF EXISTS quests CASCADE',
    'DROP TABLE IF EXISTS reviews CASCADE',
    'DROP TABLE IF EXISTS skill_nodes CASCADE',
    'DROP TABLE IF EXISTS energy_checkins CASCADE',
    'DROP TABLE IF EXISTS stats CASCADE',
    'DROP TABLE IF EXISTS profile CASCADE',
    'DROP TABLE IF EXISTS bosses CASCADE',
  ];
  for (const statement of drops) {
    await sql.query(statement);
    console.log('OK [legacy]:', statement);
  }
}

async function runFile(label, content) {
  const statements = content
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
    const preview = statement.split('\n')[0].slice(0, 72);
    console.log(`OK [${label}]:`, preview);
  }
  console.log(`Applied ${statements.length} statements from ${label}`);
}

const schemaPath = resolve(root, 'server', 'db', 'schema.sql');

await dropLegacyGameTables();

const migrationsDir = resolve(root, 'server', 'db', 'migrations');
if (existsSync(migrationsDir)) {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const path = resolve(migrationsDir, file);
    await runFile(file, readFileSync(path, 'utf8'));
  }
}

await runFile('schema.sql', readFileSync(schemaPath, 'utf8'));

console.log('Database migration complete.');

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
