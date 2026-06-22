/**
 * Vercel serverless catch-all — handles /api/* (except /api/health.ts).
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import type { Hono as HonoType } from 'hono';

type LifeQuestApp = HonoType;

let app: LifeQuestApp | null = null;

async function getApp(): Promise<LifeQuestApp> {
  if (app) return app;
  const [{ createApp }, { getPool }] = await Promise.all([
    import('../server/app.ts'),
    import('../server/db/pool.ts'),
  ]);
  app = createApp(getPool());
  return app;
}

const wrapper = new Hono();

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
