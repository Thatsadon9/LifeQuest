/**
 * LifeQuest sync API — auth, per-user sync, and Mira chat.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeBundles } from '../src/lib/syncMerge.ts';
import { loadBundle, saveBundle } from './db/bundleRepo.ts';
import { handleMiraChat, miraStatus } from './mira/chat.ts';
import { rateLimit } from './middleware/rateLimit.ts';
import { requireUser, type AuthVariables } from './middleware/userAuth.ts';
import { registerAuthRoutes } from './routes/auth.ts';
import { deleteExpiredSessions } from './auth/session.ts';
import type { ExportBundle, SyncDeletions, SyncRequest, SyncResponse } from '../src/types/index.ts';
import type { MiraChatRequest } from '../src/lib/mira/types.ts';

neonConfig.webSocketConstructor = ws;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv(resolve(root, '.env'));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Copy .env.example to .env and set your Neon connection string.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = new Hono<{ Variables: AuthVariables }>();

const allowedOrigins = (
  process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ]
) as string[];

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0];
      return allowedOrigins.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

registerAuthRoutes(app, pool);

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'lifequest-api', auth: true }),
);

app.get('/api/mira/status', (c) => c.json(miraStatus()));

app.post(
  '/api/mira/chat',
  requireUser(pool),
  rateLimit(24, 60_000),
  async (c) => {
    let body: MiraChatRequest;
    try {
      body = (await c.req.json()) as MiraChatRequest;
    } catch {
      return c.text('Invalid JSON body', 400);
    }
    if (!body?.turns || !body?.context) {
      return c.text('Missing turns or context', 400);
    }
    const result = await handleMiraChat(body);
    if (result.error) {
      const status = result.error === 'not_configured' ? 503 : 500;
      return c.json(result, status);
    }
    return c.json(result);
  },
);

app.post(
  '/api/sync',
  requireUser(pool),
  rateLimit(40, 60_000),
  async (c) => {
    const userId = c.get('userId');
    let body: SyncRequest;
    try {
      body = (await c.req.json()) as SyncRequest;
    } catch {
      return c.text('Invalid JSON body', 400);
    }

    if (!body?.bundle || !Array.isArray(body.bundle.profile)) {
      return c.text('Missing or invalid bundle', 400);
    }

    const deletions = body.deletions as SyncDeletions | undefined;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [userId]);

      const tx = {
        query: async (text: string, params: unknown[] = []) => {
          const result = await client.query(text, params);
          return result.rows as Record<string, unknown>[];
        },
      };

      const remote = await loadBundle(tx, userId);
      const merged = mergeBundles(body.bundle, remote, deletions);
      const exportedAt = Date.now();
      const toSave: ExportBundle = { ...merged, exportedAt };

      await saveBundle(tx, userId, toSave);
      await client.query('COMMIT');

      const response: SyncResponse = { bundle: toSave, exportedAt };
      return c.json(response);
    } catch (err) {
      await client.query('ROLLBACK');
      const message = err instanceof Error ? err.message : String(err);
      console.error('Sync save failed:', err);
      return c.json({ error: 'Failed to save sync bundle', detail: message }, 500);
    } finally {
      client.release();
    }
  },
);

const port = Number(process.env.SYNC_PORT ?? 3001);

void deleteExpiredSessions(pool).catch(() => {});

serve({ fetch: app.fetch, port }, () => {
  console.log(`LifeQuest API listening on http://localhost:${port}`);
});

function loadEnv(path: string) {
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
