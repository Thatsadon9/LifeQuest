/**
 * Bundled entry for Vercel api/sync.js (sync + Mira routes).
 */
import { createApp } from '../server/app.ts';
import { getPool } from '../server/db/pool.ts';
import { forwardToHono, type NodeReq, type NodeRes } from './vercel-request.ts';

const boot = (() => {
  try {
    return { app: createApp(getPool()), error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API boot failed:', err);
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
  maxDuration: 30,
};
