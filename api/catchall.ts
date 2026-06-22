/** Auth API for Vercel — routes /api/auth/* via rewrite. */
import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { createAuthApp } from '../server/authApp';
import { getPool } from '../server/db/pool';

const boot = (() => {
  try {
    return { app: createAuthApp(getPool()), error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Auth API boot failed:', err);
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
  maxDuration: 10,
};
