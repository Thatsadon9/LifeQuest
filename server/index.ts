/**
 * Local dev API server (production uses api/index.ts on Vercel).
 */
import { serve } from '@hono/node-server';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { getPool } from './db/pool.ts';
import { loadEnv } from './env.ts';

neonConfig.webSocketConstructor = ws;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv(resolve(root, '.env'));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Copy .env.example to .env and set your Neon connection string.');
  process.exit(1);
}

const pool = getPool();
const app = createApp(pool);
const port = Number(process.env.SYNC_PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`LifeQuest API listening on http://localhost:${port}`);
});
