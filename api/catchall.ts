/** Auth API for Vercel — uses api/_server copy bundled at build time. */
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

let appFetch: ((request: Request) => Response | Promise<Response>) | null = null;

async function getAppFetch() {
  if (appFetch) return appFetch;
  const [{ createAuthApp }, { getPool }] = await Promise.all([
    import('./_server/authApp'),
    import('./_server/db/pool'),
  ]);
  const app = createAuthApp(getPool());
  appFetch = (request: Request) => app.fetch(request);
  return appFetch;
}

export default async function handler(req: NodeReq, res: NodeRes) {
  try {
    const fetchApp = await getAppFetch();
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

    const response = await fetchApp(new Request(`https://${host}${path}`, init));
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
    console.error('Auth handler failed:', err);
    res.status(503).json({ error: message, code: 'server_config' });
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};
