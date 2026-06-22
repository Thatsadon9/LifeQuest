export type NodeReq = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type NodeRes = {
  status: (code: number) => NodeRes;
  setHeader: (key: string, value: string) => void;
  appendHeader?: (key: string, value: string) => void;
  send: (body: string) => void;
  json: (body: unknown) => void;
};

export function requestBody(req: NodeReq): BodyInit | undefined {
  const { body } = req;
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string') return body;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

export async function forwardToHono(
  app: { fetch: (request: Request) => Response | Promise<Response> },
  req: NodeReq,
  res: NodeRes,
  defaultHost = 'lifequest0.vercel.app',
): Promise<void> {
  const host = String(req.headers.host ?? defaultHost);
  const path = req.url?.startsWith('/') ? req.url : `/${req.url ?? ''}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const init: RequestInit = { method: req.method ?? 'GET', headers };
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    const body = requestBody(req);
    if (body !== undefined) init.body = body;
  }

  const response = await app.fetch(new Request(`https://${host}${path}`, init));
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie' && res.appendHeader) {
      res.appendHeader(key, value);
    } else {
      res.setHeader(key, value);
    }
  });
  res.send(await response.text());
}
