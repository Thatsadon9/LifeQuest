/**
 * Vercel serverless entry — serves /api/* on the same origin as the PWA.
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import type { Hono as HonoType } from 'hono';

type LifeQuestApp = HonoType;

let appPromise: Promise<LifeQuestApp> | null = null;

async function loadApp(): Promise<LifeQuestApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const [{ createApp }, { getPool }] = await Promise.all([
        import('../server/app'),
        import('../server/db/pool'),
      ]);
      return createApp(getPool());
    })();
  }
  return appPromise;
}

const wrapper = new Hono();

wrapper.all('*', async (c) => {
  try {
    const app = await loadApp();
    return app.fetch(c.req.raw);
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
