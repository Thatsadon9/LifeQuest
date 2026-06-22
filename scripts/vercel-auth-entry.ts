/**
 * Bundled entry for Vercel api/catchall.js — do not import from client.
 */
import { createAuthApp } from '../server/authApp.ts';
import { getPool } from '../server/db/pool.ts';
import { forwardToHono, type NodeReq, type NodeRes } from './vercel-request.ts';

const boot = (() => {
  try {
    return { app: createAuthApp(getPool()), error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Auth API boot failed:', err);
    return { app: null, error: message };
  }
})();

async function handler(req: NodeReq, res: NodeRes) {
  if (boot.error || !boot.app) {
    res.status(503).json({ error: boot.error ?? 'Server unavailable', code: 'server_config' });
    return;
  }

  try {
    await forwardToHono(boot.app, req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ error: message, code: 'server_config' });
  }
}

export default handler;

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};
