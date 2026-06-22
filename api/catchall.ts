/**
 * Vercel API — auth routes (native Hono export, lightweight bundle).
 */
import { createAuthApp } from '../server/authApp';
import { getPool } from '../server/db/pool';

function buildApp() {
  return createAuthApp(getPool());
}

let app: ReturnType<typeof createAuthApp> | undefined;

export default {
  fetch(request: Request) {
    try {
      if (!app) app = buildApp();
      return app.fetch(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Auth API error:', err);
      return Response.json({ error: message, code: 'server_config' }, { status: 503 });
    }
  },
};

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};
