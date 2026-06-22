/**
 * Vercel serverless — cloud sync endpoint.
 */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { createApp } from '../server/app.ts';
import { getPool } from '../server/db/pool.ts';

const boot = (() => {
  try {
    return { app: createApp(getPool()), error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Sync API boot failed:', err);
    return { app: null, error: message };
  }
})();

const wrapper = new Hono();

wrapper.all('*', (c) => {
  if (boot.error || !boot.app) {
    return c.json({ error: boot.error ?? 'Server unavailable', code: 'server_config' }, 503);
  }
  return boot.app.fetch(c.req.raw);
});

export default handle(wrapper);

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
