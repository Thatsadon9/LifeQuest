/**
 * Vercel serverless catch-all — handles /api and /api/* on the same origin as the PWA.
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import type { Hono as HonoType } from 'hono';

type LifeQuestApp = HonoType;

let app: LifeQuestApp | null = null;
let appError: string | null = null;

async function getApp(): Promise<LifeQuestApp> {
  if (app) return app;
  if (appError) throw new Error(appError);

  try {
    const [{ createApp }, { getPool }] = await Promise.all([
      import('../server/app.ts'),
      import('../server/db/pool.ts'),
    ]);
    app = createApp(getPool());
    return app;
  } catch (err) {
    appError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

const wrapper = new Hono();

wrapper.get('/api/health', (c) =>
  c.json({ ok: true, service: 'lifequest-api', auth: true }),
);

wrapper.all('*', async (c) => {
  try {
    const api = await getApp();
    return api.fetch(c.req.raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API request failed:', err);
    return c.json({ error: message, code: 'server_config' }, 503);
  }
});

export default handle(wrapper);

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
