/**
 * Vercel serverless entry — serves /api/* on the same origin as the PWA.
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { createApp } from '../server/app.ts';
import { getPool } from '../server/db/pool.ts';

function buildApp() {
  return createApp(getPool());
}

let app: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!app) app = buildApp();
  return app;
}

const wrapper = new Hono();

wrapper.all('*', (c) => {
  try {
    return getApp().fetch(c.req.raw, c.env);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API init failed:', err);
    return c.json({ error: message, code: 'server_config' }, 503);
  }
});

export default handle(wrapper);

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
