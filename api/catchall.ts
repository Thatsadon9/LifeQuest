/** Auth API for Vercel — static imports so the bundler includes api/_server. */
import { createAuthApp } from './_server/authApp.ts';
import { getPool } from './_server/db/pool.ts';

const boot = (() => {
  try {
    return { app: createAuthApp(getPool()), error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Auth API boot failed:', err);
    return { app: null, error: message };
  }
})();

type NodeReq = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type NodeRes = {
  status: (code: number) => NodeRes;
  setHeader: (key: string, value: string) => void;
  appendHeader?: (key: string, value: string) => void;
  send: (body: string) => void;
  json: (body: unknown) => void;
};

export default async function handler(req: NodeReq, res: NodeRes) {
  if (boot.error || !boot.app) {
    res.status(503).json({ error: boot.error ?? 'Server unavailable', code: 'server_config' });
    return;
  }

  try {
    const host = String(req.headers.host ?? 'lifequest0.vercel.app');
    const path = req.url?.startsWith('/') ? req.url : `/${req.url ?? ''}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else headers.set(key, value);
    }

    const init: RequestInit = { method: req.method ?? 'GET', headers };
    if (req.method && req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await boot.app.fetch(new Request(`https://${host}${path}`, init));
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie' && res.appendHeader) {
        res.appendHeader(key, value);
      } else {
        res.setHeader(key, value);
      }
    });
    res.send(await response.text());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ error: message, code: 'server_config' });
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};
